/**
 * Storage Service - 0G Decentralized Storage
 * Stores AI-generated images and metadata on 0G Storage network
 *
 * Note: For MVP, we'll use a simplified approach that uploads via API route.
 * Full 0G SDK integration can be added later for direct uploads.
 */

// 0G Storage configuration
const STORAGE_GATEWAY = process.env.NEXT_PUBLIC_0G_GATEWAY || 'https://indexer-testnet.0g.ai';
const STORAGE_INDEXER = process.env.NEXT_PUBLIC_0G_INDEXER || 'https://indexer-testnet.0g.ai';

export interface StorageResult {
  hash: string;
  success: boolean;
  error?: string;
  gatewayUrl?: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // Gateway URL to the image
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

/**
 * Get gateway URL for a storage hash
 */
export function getStorageUrl(hash: string): string {
  return `${STORAGE_GATEWAY}/${hash}`;
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

    return {
      hash: result.hash,
      success: true,
      gatewayUrl: getStorageUrl(result.hash),
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
    console.log('[0G Storage] Metadata:', JSON.stringify(metadata, null, 2));

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

    return {
      hash: result.hash,
      success: true,
      gatewayUrl: getStorageUrl(result.hash),
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
  return !!(STORAGE_GATEWAY && STORAGE_INDEXER);
}

/**
 * Get storage configuration
 */
export function getStorageConfig() {
  return {
    gateway: STORAGE_GATEWAY,
    indexer: STORAGE_INDEXER,
    configured: isStorageConfigured(),
  };
}
