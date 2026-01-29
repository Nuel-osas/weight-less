/**
 * API Route: Upload to 0G Storage
 * Server-side route that handles uploads to 0G decentralized storage
 *
 * For MVP: Uses content-hash based storage simulation
 * For Production: Integrate 0G SDK with backend wallet for on-chain storage
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 0G Storage configuration
const STORAGE_GATEWAY = process.env.NEXT_PUBLIC_0G_GATEWAY || 'https://indexer-testnet.0g.ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, type } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      );
    }

    console.log('[0G Storage API] Starting upload...');
    console.log('[0G Storage API] Data type:', type);

    let contentBuffer: Buffer;
    let contentType: string;

    // Handle different data types
    if (type === 'image') {
      // Convert base64 to buffer
      const parts = data.split(',');
      contentType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const base64 = parts[1];
      contentBuffer = Buffer.from(base64, 'base64');
      console.log(`[0G Storage API] Image size: ${(contentBuffer.length / 1024).toFixed(2)} KB`);
    } else if (type === 'json') {
      // Convert JSON to buffer
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      contentBuffer = Buffer.from(jsonString, 'utf-8');
      contentType = 'application/json';
      console.log(`[0G Storage API] JSON size: ${(contentBuffer.length / 1024).toFixed(2)} KB`);
    } else {
      return NextResponse.json(
        { error: 'Invalid data type. Use "image" or "json"' },
        { status: 400 }
      );
    }

    // Generate content-hash (deterministic based on content)
    // This simulates 0G Storage - same content = same hash
    const hash = crypto.createHash('sha256').update(contentBuffer).digest('hex');
    const storageHash = `0x${hash}`;

    console.log(`[0G Storage API] ✅ Content hash generated!`);
    console.log(`[0G Storage API] Hash: ${storageHash}`);

    return NextResponse.json({
      success: true,
      hash: storageHash,
      gatewayUrl: `${STORAGE_GATEWAY}/${storageHash}`,
      size: contentBuffer.length,
      contentType: contentType,
    });

  } catch (error) {
    console.error('[0G Storage API] Upload error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload to 0G Storage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
