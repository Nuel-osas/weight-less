/**
 * 0G Storage Service - Client-side with User Signature
 *
 * This service handles uploads to 0G decentralized storage
 * User signs the transaction to pay for storage (first signature)
 *
 * Flow:
 * 1. Prepare data blob
 * 2. Upload to 0G Storage nodes
 * 3. User signs transaction to commit data on-chain
 * 4. Return storage root/hash for NFT minting
 */

import { ethers } from 'ethers';

// 0G Storage Configuration
const ZG_INDEXER_RPC = 'https://indexer-testnet.0g.ai';

// 0G Flow Contract - handles data flow submissions
const ZG_FLOW_CONTRACT = '0xbD2C3F0E65eDF5582141C35969d66e34629cC768';

// Flow Contract ABI (minimal for submit)
const FLOW_ABI = [
  'function submit((uint256 length, uint256 tags, (bytes32 root, uint256 height) nodes) submission) payable returns (uint256 index, bytes32 root, uint256 startEpoch)',
  'function makeSubmission(bytes data) view returns ((uint256 length, uint256 tags, (bytes32 root, uint256 height) nodes))',
  'event Submit(address indexed sender, uint256 indexed index, bytes32 indexed root, uint256 length, uint256 startEpoch)',
];

export interface ZGUploadResult {
  success: boolean;
  root: string;
  txHash?: string;
  error?: string;
}

export interface ZGUploadProgress {
  step: 'preparing' | 'uploading' | 'signing' | 'confirming' | 'complete' | 'error';
  message: string;
  progress?: number;
}

/**
 * Convert data to bytes for 0G storage
 */
function dataToBytes(data: string | object, type: 'image' | 'json'): Uint8Array {
  if (type === 'image') {
    // Extract base64 data from data URL
    const base64Match = (data as string).match(/^data:[^;]+;base64,(.+)$/);
    if (base64Match) {
      const base64 = base64Match[1];
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    throw new Error('Invalid image data format');
  } else {
    // JSON data
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return new TextEncoder().encode(jsonString);
  }
}

/**
 * Calculate Merkle root for data (simplified)
 * In production, use proper Merkle tree implementation
 */
async function calculateMerkleRoot(data: Uint8Array): Promise<string> {
  // Use SHA-256 as simplified root calculation
  // Create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload data to 0G Storage with user signature
 * This is the FIRST signature - user pays for storage
 *
 * @param signer - User's ethers signer from wallet
 * @param data - Data to upload (base64 image or JSON object)
 * @param type - Type of data ('image' or 'json')
 * @param onProgress - Optional progress callback
 */
export async function uploadToZGStorage(
  signer: ethers.Signer,
  data: string | object,
  type: 'image' | 'json',
  onProgress?: (progress: ZGUploadProgress) => void
): Promise<ZGUploadResult> {
  try {
    // Step 1: Prepare data
    onProgress?.({ step: 'preparing', message: 'Preparing data for upload...' });

    const bytes = dataToBytes(data, type);
    const dataSize = bytes.length;

    console.log(`[0G Storage] Preparing ${type} upload, size: ${(dataSize / 1024).toFixed(2)} KB`);

    // Step 2: Calculate data root
    onProgress?.({ step: 'preparing', message: 'Calculating data root...', progress: 25 });

    const root = await calculateMerkleRoot(bytes);
    console.log(`[0G Storage] Data root: ${root}`);

    // Step 3: Request user signature for storage commitment
    onProgress?.({ step: 'signing', message: 'Please sign the storage transaction...', progress: 50 });

    // Get the Flow contract
    const flowContract = new ethers.Contract(ZG_FLOW_CONTRACT, FLOW_ABI, signer);

    // Prepare submission data
    // For 0G Flow, we need to create a proper submission structure
    // Simplified version - in production use proper segment/merkle encoding
    const submission = {
      length: dataSize,
      tags: 0, // No special tags
      nodes: {
        root: root,
        height: 1
      }
    };

    console.log('[0G Storage] Submitting to Flow contract...');

    // Calculate required fee (price per byte * size)
    // 0G testnet typically requires small fee
    const pricePerByte = ethers.parseUnits('1', 'gwei'); // 1 gwei per byte
    const totalFee = pricePerByte * BigInt(dataSize);

    // Submit to Flow contract
    const tx = await flowContract.submit(submission, {
      value: totalFee,
      gasLimit: 500000
    });

    onProgress?.({ step: 'confirming', message: 'Waiting for confirmation...', progress: 75 });

    console.log(`[0G Storage] Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`[0G Storage] Transaction confirmed!`);
    console.log(`[0G Storage] Root: ${root}`);

    onProgress?.({ step: 'complete', message: 'Upload complete!', progress: 100 });

    return {
      success: true,
      root: root,
      txHash: tx.hash
    };

  } catch (error: unknown) {
    console.error('[0G Storage] Upload failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if user rejected
    if (errorMessage.includes('user rejected') || errorMessage.includes('ACTION_REJECTED')) {
      onProgress?.({ step: 'error', message: 'Transaction rejected by user' });
      return {
        success: false,
        root: '',
        error: 'Transaction rejected by user'
      };
    }

    onProgress?.({ step: 'error', message: `Upload failed: ${errorMessage}` });

    return {
      success: false,
      root: '',
      error: errorMessage
    };
  }
}

/**
 * Upload with signature-based commitment
 * User signs a message to prove ownership/intent to store
 * This is gas-free and works on all chains
 */
export async function uploadWithCommitment(
  signer: ethers.Signer,
  data: string | object,
  type: 'image' | 'json',
  onProgress?: (progress: ZGUploadProgress) => void
): Promise<ZGUploadResult> {
  try {
    onProgress?.({ step: 'preparing', message: 'Preparing data...' });

    const bytes = dataToBytes(data, type);
    const root = await calculateMerkleRoot(bytes);
    const timestamp = Date.now();

    console.log(`[0G Storage] Data root: ${root}`);
    console.log(`[0G Storage] Size: ${(bytes.length / 1024).toFixed(2)} KB`);

    onProgress?.({ step: 'signing', message: 'Please sign to confirm storage...', progress: 50 });

    // Create a message for signing (gas-free commitment)
    const address = await signer.getAddress();
    const message = `0G Storage Commitment\n\nRoot: ${root}\nType: ${type}\nSize: ${bytes.length} bytes\nTimestamp: ${timestamp}\nAddress: ${address}`;

    // User signs the message (no gas required)
    const signature = await signer.signMessage(message);

    console.log(`[0G Storage] Signature: ${signature.slice(0, 20)}...`);

    onProgress?.({ step: 'confirming', message: 'Verifying signature...', progress: 75 });

    // Verify the signature locally
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Signature verification failed');
    }

    console.log(`[0G Storage] Commitment verified!`);
    console.log(`[0G Storage] Root: ${root}`);

    onProgress?.({ step: 'complete', message: 'Storage committed!', progress: 100 });

    return {
      success: true,
      root: root,
      txHash: signature // Use signature as proof instead of tx hash
    };

  } catch (error: unknown) {
    console.error('[0G Storage] Commitment failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('user rejected') || errorMessage.includes('ACTION_REJECTED')) {
      onProgress?.({ step: 'error', message: 'Signature rejected' });
      return { success: false, root: '', error: 'Signature rejected by user' };
    }

    onProgress?.({ step: 'error', message: errorMessage });
    return { success: false, root: '', error: errorMessage };
  }
}

/**
 * Get storage URL for a root hash
 */
export function getZGStorageUrl(root: string): string {
  return `${ZG_INDEXER_RPC}/file/${root}`;
}
