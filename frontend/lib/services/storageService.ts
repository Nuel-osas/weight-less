/**
 * Storage Service - 0G Decentralized Storage
 * Uploads to 0G Storage via API route (server handles SDK)
 *
 * Flow:
 * 1. Client sends data to API route
 * 2. API route uploads to 0G using SDK with backend wallet
 * 3. User only signs once for NFT minting
 */

// 0G Storage configuration - use turbo indexer with correct endpoint
const STORAGE_GATEWAY = process.env.NEXT_PUBLIC_0G_GATEWAY || 'https://indexer-storage-testnet-turbo.0g.ai';

export interface StorageResult {
  hash: string;
  success: boolean;
  error?: string;
  gatewayUrl?: string;
  txHash?: string;
  onChain?: boolean;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

/**
 * Get gateway URL for a storage hash
 * Uses 0G indexer query parameter format: /file?root={hash}
 */
export function getStorageUrl(hash: string): string {
  return `${STORAGE_GATEWAY}/file?root=${hash}`;
}

/**
 * Upload image to 0G Storage
 * @param base64Image - Base64 encoded image data URL
 * @returns Storage hash and gateway URL
 */
export async function uploadImage(base64Image: string): Promise<StorageResult> {
  try {
    console.log('[0G Storage] Starting image upload...');

    const response = await fetch('/api/upload-to-0g', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: base64Image,
        type: 'image',
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log(`[0G Storage] Image uploaded successfully!`);
    console.log(`[0G Storage] Hash: ${result.hash}`);
    if (result.onChain) {
      console.log(`[0G Storage] TX Hash: ${result.txHash}`);
    }

    return {
      hash: result.hash,
      success: true,
      gatewayUrl: getStorageUrl(result.hash),
      txHash: result.txHash,
      onChain: result.onChain,
    };
  } catch (error) {
    console.error('[0G Storage] Image upload error:', error);
    return {
      hash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

/**
 * Upload NFT metadata to 0G Storage
 * @param metadata - NFT metadata object
 * @returns Storage hash for the metadata
 */
export async function uploadMetadata(metadata: NFTMetadata): Promise<StorageResult> {
  try {
    console.log('[0G Storage] Starting metadata upload...');

    const response = await fetch('/api/upload-to-0g', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: metadata,
        type: 'json',
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log(`[0G Storage] Metadata uploaded successfully!`);
    console.log(`[0G Storage] Hash: ${result.hash}`);
    if (result.onChain) {
      console.log(`[0G Storage] TX Hash: ${result.txHash}`);
    }

    return {
      hash: result.hash,
      success: true,
      gatewayUrl: getStorageUrl(result.hash),
      txHash: result.txHash,
      onChain: result.onChain,
    };
  } catch (error) {
    console.error('[0G Storage] Metadata upload error:', error);
    return {
      hash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload metadata',
    };
  }
}

/**
 * Create NFT metadata object
 */
export function createMetadata(
  name: string,
  description: string,
  imageHash: string,
  style: string,
  prompt: string,
  resolution: string = '1K'
): NFTMetadata {
  return {
    name,
    description,
    image: getStorageUrl(imageHash),
    attributes: [
      { trait_type: 'Style', value: style },
      { trait_type: 'Resolution', value: resolution },
      { trait_type: 'Generator', value: 'Gemini AI' },
      { trait_type: 'Prompt', value: prompt },
    ],
  };
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!STORAGE_GATEWAY;
}

/**
 * Get storage configuration
 */
export function getStorageConfig() {
  return {
    gateway: STORAGE_GATEWAY,
    configured: isStorageConfigured(),
  };
}
