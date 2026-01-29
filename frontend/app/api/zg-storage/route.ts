/**
 * API Route: Real 0G Storage Upload
 * Uses 0G SDK to upload data to decentralized storage
 *
 * Flow:
 * 1. Receive image/metadata from client
 * 2. Upload to 0G Storage nodes using SDK
 * 3. Submit to Flow contract (requires funded wallet)
 * 4. Return merkle root for NFT minting
 */

import { NextRequest, NextResponse } from 'next/server';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

// 0G Network Configuration
// Using turbo indexer (standard returns 503)
const ZG_INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';
const ZG_EVM_RPC = 'https://evmrpc-testnet.0g.ai';
const ZG_FLOW_CONTRACT = '0xbD2C3F0E65eDF5582141C35969d66e34629cC768';

// Server wallet for paying storage fees (needs 0G tokens)
const SERVER_PRIVATE_KEY = process.env.ZG_STORAGE_PRIVATE_KEY || '';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  let zgFile: Awaited<ReturnType<typeof ZgFile.fromFilePath>> | null = null;

  try {
    const body = await request.json();
    const { data, type } = body;

    if (!data) {
      return NextResponse.json({ success: false, error: 'No data provided' }, { status: 400 });
    }

    if (!SERVER_PRIVATE_KEY) {
      console.error('[0G Storage] No server private key configured');
      return NextResponse.json({
        success: false,
        error: 'Storage service not configured. Set ZG_STORAGE_PRIVATE_KEY env var.'
      }, { status: 500 });
    }

    console.log('[0G Storage] Starting real upload...');
    console.log('[0G Storage] Type:', type);

    // Convert data to buffer
    let contentBuffer: Buffer;
    let fileName: string;

    if (type === 'image') {
      // Extract base64 from data URL
      const parts = (data as string).split(',');
      const base64 = parts[1];
      contentBuffer = Buffer.from(base64, 'base64');
      fileName = `image-${randomUUID()}.png`;
    } else if (type === 'json') {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      contentBuffer = Buffer.from(jsonString, 'utf-8');
      fileName = `metadata-${randomUUID()}.json`;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    console.log(`[0G Storage] File size: ${(contentBuffer.length / 1024).toFixed(2)} KB`);

    // Create temp directory if needed
    const tempDir = join(tmpdir(), '0g-uploads');
    await mkdir(tempDir, { recursive: true });

    // Write to temp file (SDK requires file path)
    tempFilePath = join(tempDir, fileName);
    await writeFile(tempFilePath, contentBuffer);
    console.log(`[0G Storage] Temp file: ${tempFilePath}`);

    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(ZG_EVM_RPC);
    const signer = new ethers.Wallet(SERVER_PRIVATE_KEY, provider);

    console.log(`[0G Storage] Using wallet: ${await signer.getAddress()}`);

    // Check wallet balance
    const balance = await provider.getBalance(signer.address);
    console.log(`[0G Storage] Wallet balance: ${ethers.formatEther(balance)} 0G`);

    if (balance === BigInt(0)) {
      return NextResponse.json({
        success: false,
        error: 'Storage wallet has no funds. Please fund it with 0G tokens.'
      }, { status: 500 });
    }

    // Initialize 0G Indexer
    const indexer = new Indexer(ZG_INDEXER_RPC);

    // Create ZgFile from path
    zgFile = await ZgFile.fromFilePath(tempFilePath);
    const [tree, treeErr] = await zgFile.merkleTree();

    if (treeErr || !tree) {
      throw new Error(`Failed to create merkle tree: ${treeErr}`);
    }

    const rootHash = tree.rootHash();
    console.log(`[0G Storage] Merkle root: ${rootHash}`);

    // Upload to 0G Storage using manual submission (SDK has ABI mismatch)
    console.log('[0G Storage] Uploading to storage nodes...');

    // Create submission data
    const [submissionData, subErr] = await zgFile.createSubmission('0x');
    if (subErr || !submissionData) {
      throw new Error(`Failed to create submission: ${subErr}`);
    }

    console.log('[0G Storage] Submission details:');
    console.log('[0G Storage]   length:', submissionData.length.toString());
    console.log('[0G Storage]   nodes count:', submissionData.nodes.length);

    // Get storage node info to find flow contract address
    const [nodes, nodesErr] = await indexer.selectNodes(1);
    if (nodesErr || nodes.length === 0) {
      throw new Error(`Failed to select storage nodes: ${nodesErr}`);
    }

    const nodeStatus = await nodes[0].getStatus();
    const flowAddress = nodeStatus?.networkIdentity?.flowAddress;
    if (!flowAddress) {
      throw new Error('Could not get flow contract address from storage node');
    }
    console.log('[0G Storage] Flow contract:', flowAddress);

    // Get market price for fee calculation
    const flowAbiRead = ['function market() view returns (address)'];
    const flowContractRead = new ethers.Contract(flowAddress, flowAbiRead, provider);
    const marketAddr = await flowContractRead.market();

    const marketAbi = ['function pricePerSector() view returns (uint256)'];
    const marketContract = new ethers.Contract(marketAddr, marketAbi, provider);
    const pricePerSector = await marketContract.pricePerSector();

    // Calculate fee with buffer
    const sectorSize = 256;
    const numSectors = Math.ceil(Number(submissionData.length) / sectorSize);
    const fee = pricePerSector * BigInt(numSectors) * BigInt(2); // 2x buffer for safety
    console.log(`[0G Storage] Fee: ${ethers.formatEther(fee)} 0G`);

    // Build full Submission struct (SDK ABI is missing submitter field!)
    const fullSubmission = {
      data: submissionData,
      submitter: await signer.getAddress()
    };

    // Correct ABI with submitter field
    const flowSubmitAbi = [
      'function submit(((uint256 length, bytes tags, (bytes32 root, uint256 height)[] nodes) data, address submitter) submission) payable returns (uint256, bytes32, uint256, uint256)'
    ];

    const flowContract = new ethers.Contract(flowAddress, flowSubmitAbi, signer);

    // Submit to Flow contract
    console.log('[0G Storage] Submitting to Flow contract...');
    const tx = await flowContract.submit(fullSubmission, {
      value: fee,
      gasLimit: 1000000,
      gasPrice: BigInt(5000000000)
    });

    console.log(`[0G Storage] TX sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[0G Storage] TX confirmed in block ${receipt?.blockNumber}`);

    const txHash = tx.hash;

    // Parse transaction logs to get submission index
    const flowAbiEvents = ['event Submit(address indexed sender, bytes32 indexed identity, uint256 submissionIndex, uint256 startPos, uint256 length, tuple(uint256 length, bytes tags, tuple(bytes32 root, uint256 height)[] nodes) submission)'];
    const flowEventContract = new ethers.Contract(flowAddress, flowAbiEvents, provider);

    let submissionIndex: number | null = null;
    for (const log of receipt?.logs || []) {
      try {
        const parsed = flowEventContract.interface.parseLog({ topics: log.topics as string[], data: log.data });
        if (parsed?.name === 'Submit') {
          submissionIndex = Number(parsed.args.submissionIndex);
          console.log(`[0G Storage] Submission index: ${submissionIndex}`);
          break;
        }
      } catch {
        // Not a Submit event
      }
    }

    console.log(`[0G Storage] ✅ On-chain submission successful!`);
    console.log(`[0G Storage] Root hash registered: ${rootHash}`);
    console.log(`[0G Storage] TX Hash: ${txHash}`);

    // STEP 2: Upload actual data to storage nodes
    // The on-chain submission registers the merkle root, but we need to upload
    // the actual file data to storage nodes so it can be retrieved
    console.log('[0G Storage] Uploading data segments to storage nodes...');

    try {
      // Use SDK's upload with skipTx=true since we already did on-chain submission
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [uploadResult, uploadErr] = await indexer.upload(
        zgFile,
        ZG_EVM_RPC,
        signer as any,
        {
          tags: '0x',
          finalityRequired: true,
          taskSize: 10,
          expectedReplica: 1,
          skipTx: true, // Skip on-chain tx since we already did it manually
          fee: BigInt(0),
        }
      );

      if (uploadErr) {
        console.warn('[0G Storage] Data upload warning:', uploadErr);
      } else {
        console.log(`[0G Storage] ✅ Data uploaded to storage nodes`);
      }
    } catch (uploadError) {
      // Log but don't fail - on-chain registration succeeded
      console.warn('[0G Storage] Data upload to nodes failed:', uploadError);
      console.warn('[0G Storage] On-chain registration succeeded, but file may not be retrievable via gateway');
    }

    console.log(`[0G Storage] Root: ${rootHash}`);

    // Clean up temp file
    await zgFile.close();

    return NextResponse.json({
      success: true,
      root: rootHash,
      txHash: txHash,
      size: contentBuffer.length,
      type: type,
      gatewayUrl: `${ZG_INDEXER_RPC}/file?root=${rootHash}`
    });

  } catch (error) {
    console.error('[0G Storage] Upload error:', error);

    // Ensure zgFile is closed on error
    if (zgFile) {
      try {
        await zgFile.close();
      } catch {
        // Ignore close errors
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }, { status: 500 });

  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

export async function GET() {
  // Health check / diagnostic endpoint
  const hasKey = !!SERVER_PRIVATE_KEY;

  // Try to get diagnostic info from the network
  let diagnostics: Record<string, unknown> = {};

  try {
    if (hasKey) {
      const provider = new ethers.JsonRpcProvider(ZG_EVM_RPC);
      const signer = new ethers.Wallet(SERVER_PRIVATE_KEY, provider);

      // Get wallet info
      const balance = await provider.getBalance(signer.address);
      diagnostics.walletAddress = await signer.getAddress();
      diagnostics.walletBalance = ethers.formatEther(balance) + ' 0G';

      // Try to get Flow contract info using minimal ABI
      const flowAbi = [
        'function paused() view returns (bool)',
        'function market() view returns (address)',
        'function numSubmissions() view returns (uint256)',
      ];

      // Get flow address from indexer
      const indexer = new Indexer(ZG_INDEXER_RPC);
      const [nodes, nodesErr] = await indexer.selectNodes(1);

      if (!nodesErr && nodes.length > 0) {
        const status = await nodes[0].getStatus();
        if (status?.networkIdentity?.flowAddress) {
          const flowAddress = status.networkIdentity.flowAddress;
          diagnostics.flowAddress = flowAddress;

          const flowContract = new ethers.Contract(flowAddress, flowAbi, provider);

          try {
            diagnostics.paused = await flowContract.paused();
          } catch {
            diagnostics.paused = 'unknown';
          }

          try {
            diagnostics.marketAddress = await flowContract.market();
          } catch {
            diagnostics.marketAddress = 'unknown';
          }

          try {
            diagnostics.numSubmissions = (await flowContract.numSubmissions()).toString();
          } catch {
            diagnostics.numSubmissions = 'unknown';
          }

          // Check market price if we have market address
          if (diagnostics.marketAddress && diagnostics.marketAddress !== 'unknown') {
            const marketAbi = ['function pricePerSector() view returns (uint256)'];
            const marketContract = new ethers.Contract(diagnostics.marketAddress as string, marketAbi, provider);
            try {
              const price = await marketContract.pricePerSector();
              diagnostics.pricePerSector = price.toString() + ' wei';
            } catch {
              diagnostics.pricePerSector = 'unknown';
            }
          }
        }
      }
    }
  } catch (e) {
    diagnostics.error = e instanceof Error ? e.message : 'Unknown error';
  }

  return NextResponse.json({
    status: 'ok',
    configured: hasKey,
    indexer: ZG_INDEXER_RPC,
    flowContract: ZG_FLOW_CONTRACT,
    diagnostics,
  });
}
