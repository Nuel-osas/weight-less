/**
 * Contract Service - 0G Chain NFT Minting
 * Uses ethers.js for EVM-compatible blockchain interaction
 */

import { ethers } from 'ethers';

// Contract configuration from environment variables
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xbcFa72f21921a4ae2bff73F505440cDAED4831C2';
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_0G_CHAIN_ID || '16602', 10);

// SketchNFT ABI - Only the functions we need
const CONTRACT_ABI = [
  // Mint single NFT
  'function mint(address to, string originalSketchHash, string coloredImageHash, string metadataHash, string style, string prompt) returns (uint256)',
  // Batch mint NFTs
  'function batchMint(address to, string[] originalSketchHashes, string[] coloredImageHashes, string[] metadataHashes, string[] styles, string[] prompts) returns (uint256[])',
  // Read functions
  'function getNFTData(uint256 tokenId) view returns (tuple(string originalSketchHash, string coloredImageHash, string metadataHash, string style, string prompt, address creator, uint256 createdAt))',
  'function getTokensOfOwner(address owner) view returns (uint256[])',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function totalMinted() view returns (uint256)',
  'function storageGateway() view returns (string)',
  // Events
  'event NFTMinted(uint256 indexed tokenId, address indexed creator, string originalSketchHash, string coloredImageHash, string metadataHash, string style)',
  'event BatchMinted(address indexed creator, uint256[] tokenIds, uint256 count)',
];

/**
 * Check if contract is configured
 */
export function isContractConfigured(): boolean {
  return !!CONTRACT_ADDRESS;
}

/**
 * Get contract configuration
 */
export function getContractConfig() {
  return {
    address: CONTRACT_ADDRESS,
    chainId: CHAIN_ID,
    configured: isContractConfigured(),
  };
}

/**
 * Get contract instance
 */
function getContract(signer: ethers.Signer): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Mint single NFT on 0G Chain
 * @param signer - ethers.js signer from wallet
 * @param imageHash - 0G Storage hash of the AI-generated image
 * @param metadataHash - 0G Storage hash of metadata JSON
 * @param style - Art style used
 * @param prompt - Generation prompt
 * @param originalHash - Optional: 0G Storage hash of original sketch
 * @returns Transaction hash and token ID
 */
export async function mintNFT(
  signer: ethers.Signer,
  imageHash: string,
  metadataHash: string,
  style: string,
  prompt: string,
  originalHash: string = ''
): Promise<{ txHash: string; tokenId: number }> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }

  const contract = getContract(signer);
  const userAddress = await signer.getAddress();

  console.log('[Contract] Minting NFT...');
  console.log('[Contract] To:', userAddress);
  console.log('[Contract] Image Hash:', imageHash);
  console.log('[Contract] Metadata Hash:', metadataHash);

  try {
    const tx = await contract.mint(
      userAddress,
      originalHash,
      imageHash,
      metadataHash,
      style,
      prompt
    );

    console.log('[Contract] Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('[Contract] Transaction confirmed!');

    // Extract token ID from logs
    let tokenId = 0;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed?.name === 'NFTMinted') {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch {
        // Not our event, skip
      }
    }

    console.log('[Contract] Token ID:', tokenId);

    return {
      txHash: tx.hash,
      tokenId,
    };
  } catch (error) {
    console.error('[Contract] Mint failed:', error);
    throw error;
  }
}

/**
 * Batch mint multiple NFTs in a single transaction
 * @param signer - ethers.js signer from wallet
 * @param nfts - Array of NFT data to mint
 * @returns Transaction hash and array of token IDs
 */
export async function batchMintNFTs(
  signer: ethers.Signer,
  nfts: Array<{
    imageHash: string;
    metadataHash: string;
    style: string;
    prompt: string;
    originalHash?: string;
  }>
): Promise<{ txHash: string; tokenIds: number[] }> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }

  const contract = getContract(signer);
  const userAddress = await signer.getAddress();

  console.log(`[Contract] Batch minting ${nfts.length} NFTs...`);

  // Prepare arrays for batch mint
  const originalHashes = nfts.map(n => n.originalHash || '');
  const imageHashes = nfts.map(n => n.imageHash);
  const metadataHashes = nfts.map(n => n.metadataHash);
  const styles = nfts.map(n => n.style);
  const prompts = nfts.map(n => n.prompt);

  try {
    const tx = await contract.batchMint(
      userAddress,
      originalHashes,
      imageHashes,
      metadataHashes,
      styles,
      prompts
    );

    console.log('[Contract] Batch transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('[Contract] Batch transaction confirmed!');

    // Extract token IDs from logs
    const tokenIds: number[] = [];
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed?.name === 'NFTMinted') {
          tokenIds.push(Number(parsed.args.tokenId));
        }
      } catch {
        // Not our event, skip
      }
    }

    console.log('[Contract] Token IDs:', tokenIds);

    return {
      txHash: tx.hash,
      tokenIds,
    };
  } catch (error) {
    console.error('[Contract] Batch mint failed:', error);
    throw error;
  }
}

/**
 * Get NFT data by token ID
 */
export async function getNFTData(
  provider: ethers.Provider,
  tokenId: number
): Promise<{
  originalSketchHash: string;
  coloredImageHash: string;
  metadataHash: string;
  style: string;
  prompt: string;
  creator: string;
  createdAt: number;
}> {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const data = await contract.getNFTData(tokenId);

  return {
    originalSketchHash: data.originalSketchHash,
    coloredImageHash: data.coloredImageHash,
    metadataHash: data.metadataHash,
    style: data.style,
    prompt: data.prompt,
    creator: data.creator,
    createdAt: Number(data.createdAt),
  };
}

/**
 * Get all NFTs owned by an address
 */
export async function getTokensOfOwner(
  provider: ethers.Provider,
  ownerAddress: string
): Promise<number[]> {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const tokens = await contract.getTokensOfOwner(ownerAddress);
  return tokens.map((t: bigint) => Number(t));
}

/**
 * Get total number of NFTs minted
 */
export async function getTotalMinted(provider: ethers.Provider): Promise<number> {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  return Number(await contract.totalMinted());
}

/**
 * Get 0G Explorer URL for transaction
 */
export function getExplorerUrl(txHash: string): string {
  return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
}

/**
 * Get 0G Explorer URL for NFT (token)
 */
export function getTokenExplorerUrl(tokenId: number): string {
  return `https://chainscan-galileo.0g.ai/token/${CONTRACT_ADDRESS}?a=${tokenId}`;
}
