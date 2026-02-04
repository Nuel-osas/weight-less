# Compute and Storage Architecture

> **Project**: Sketch-to-NFT - AI-Powered NFT Platform on 0G Chain  
> **Purpose**: Comprehensive documentation of compute and storage mechanisms for both server and client side

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Client-Side Compute](#client-side-compute)
3. [Server-Side Compute](#server-side-compute)
4. [Client-Side Storage](#client-side-storage)
5. [Server-Side Storage](#server-side-storage)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Smart Contract Storage](#smart-contract-storage)
8. [Performance Optimizations](#performance-optimizations)

---

## Architecture Overview

The application follows a **hybrid client-server architecture** with the following key components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                             │
├─────────────────────────────────────────────────────────────────┤
│  • Next.js Frontend (React)                                     │
│  • Wallet Integration (wagmi, RainbowKit)                       │
│  • Client-side State Management                                 │
│  • Browser-based Image Processing                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                             │
├─────────────────────────────────────────────────────────────────┤
│  • Next.js API Routes                                           │
│  • AI Compute (Gemini, Together.ai)                             │
│  • 0G Storage SDK Integration                                   │
│  • Server Wallet for Storage Fees                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN & STORAGE                         │
├─────────────────────────────────────────────────────────────────┤
│  • 0G Chain (EVM-compatible)                                    │
│  • 0G Decentralized Storage                                     │
│  • Smart Contracts (SketchNFT.sol)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Client-Side Compute

### 1. User Interface Rendering

**Location**: `frontend/app/generate/page.tsx`

**Compute Tasks**:
- React component rendering and state management
- Real-time UI updates during generation/minting
- Image preview and manipulation
- Form validation and user input processing

**Key Technologies**:
- **React 19.2.0**: Component-based UI rendering
- **Framer Motion**: Animation computations
- **Next.js**: Client-side routing and hydration

**Example - State Management**:
```typescript
// Client-side state for NFT generation
const [generatedImages, setGeneratedImages] = useState<NFTImage[]>([]);
const [collectionStatus, setCollectionStatus] = useState<CollectionStatus>(CollectionStatus.IDLE);
const [generationProgress, setGenerationProgress] = useState(0);
```

### 2. Camera & Image Processing

**Location**: `frontend/app/generate/page.tsx` (lines 82-145)

**Compute Tasks**:
- Access device camera via WebRTC
- Capture video frames
- Convert video frame to canvas
- Encode image to base64 data URL
- File reading and conversion

**Browser APIs Used**:
- `navigator.mediaDevices.getUserMedia()` - Camera access
- `HTMLCanvasElement.getContext('2d')` - Image rendering
- `FileReader` - File processing
- `canvas.toDataURL()` - Image encoding

**Example - Image Capture**:
```typescript
const capturePhoto = useCallback(() => {
  if (videoRef.current && canvasRef.current) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setUploadedImage(dataUrl);
    }
  }
}, [stopCamera]);
```

### 3. Wallet Integration

**Location**: `frontend/lib/hooks/useEthersSigner.ts`

**Compute Tasks**:
- Wallet connection management
- Transaction signing
- Address derivation
- Network switching
- Balance checking

**Key Libraries**:
- **wagmi 2.14.0**: React hooks for Ethereum
- **viem 2.22.0**: TypeScript Ethereum library
- **ethers.js 6.13.0**: Blockchain interaction
- **RainbowKit 2.2.10**: Wallet UI

**Example - Signer Hook**:
```typescript
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  return useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient]
  );
}
```

### 4. Client-Side Data Transformation

**Location**: `frontend/lib/services/zgStorageService.ts` (lines 45-64)

**Compute Tasks**:
- Base64 decoding
- Binary data conversion
- JSON serialization
- Data validation

**Example - Data Conversion**:
```typescript
function dataToBytes(data: string | object, type: 'image' | 'json'): Uint8Array {
  if (type === 'image') {
    // Extract base64 from data URL
    const base64Match = (data as string).match(/^data:[^;]+;base64,(.+)$/);
    if (base64Match) {
      const base64 = base64Match[1];
      const binaryString = atob(base64); // Browser API for base64 decode
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  } else {
    // JSON encoding
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return new TextEncoder().encode(jsonString);
  }
}
```

### 5. Merkle Root Calculation (Client-Side)

**Location**: `frontend/lib/services/zgStorageService.ts` (lines 70-78)

**Compute Tasks**:
- SHA-256 hash computation
- Merkle tree root calculation
- Cryptographic operations

**Browser APIs**:
- `crypto.subtle.digest()` - Web Crypto API

**Example**:
```typescript
async function calculateMerkleRoot(data: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## Server-Side Compute

### 1. AI Image Generation

**Location**: `frontend/app/api/generate-image/route.ts`

**Compute Provider Options**:

#### Option A: Together.ai (Free Tier)
- **Model**: `black-forest-labs/FLUX.1-schnell-Free`
- **Features**: 
  - $5 free credits
  - 1024x1024 resolution
  - 4-step generation
  - Base64 response format

**API Call**:
```typescript
const response = await fetch('https://api.together.xyz/v1/images/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOGETHER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'black-forest-labs/FLUX.1-schnell-Free',
    prompt: fullPrompt,
    width: 1024,
    height: 1024,
    steps: 4,
    n: 1,
    response_format: 'b64_json',
  }),
});
```

#### Option B: Gemini 3 Pro Image Preview
- **Model**: `gemini-3-pro-image-preview`
- **Features**:
  - Supports reference images
  - Multiple aspect ratios
  - Higher quality output
  - Requires billing

**API Call**:
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: {
    parts: contentParts, // Can include reference image
  },
  config: {
    imageConfig: {
      aspectRatio: "1:1",
      imageSize: resolution,
    },
  },
});
```

**Compute Optimizations**:
- Retry logic with exponential backoff (3 retries, 2-8s delays)
- Rate limit handling
- Parallel generation support
- Error recovery with fallbacks

### 2. AI Metadata Generation

**Location**: `frontend/app/api/generate-metadata/route.ts`

**Compute Provider**: Gemini 2.5 Flash

**Compute Tasks**:
- Natural language processing
- Creative text generation
- Structured JSON output
- Schema validation

**Model Configuration**:
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: `Create metadata for an NFT...`,
  config: {
    responseMimeType: "application/json",
    responseSchema: metadataSchema,
  },
});
```

**Output Schema**:
```typescript
{
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A creative, short name for the NFT artifact."
    },
    description: {
      type: Type.STRING,
      description: "A 1-2 sentence compelling backstory."
    }
  },
  required: ["title", "description"]
}
```

### 3. 0G Storage Upload Processing

**Location**: `frontend/app/api/zg-storage/route.ts`

**Compute Tasks**:

#### Step 1: Data Preparation
```typescript
// Convert base64 to buffer
const parts = (data as string).split(',');
const base64 = parts[1];
contentBuffer = Buffer.from(base64, 'base64');
```

#### Step 2: File System Operations
```typescript
// Create temp directory
const tempDir = join(tmpdir(), '0g-uploads');
await mkdir(tempDir, { recursive: true });

// Write to temp file (SDK requires file path)
tempFilePath = join(tempDir, fileName);
await writeFile(tempFilePath, contentBuffer);
```

#### Step 3: Merkle Tree Generation
```typescript
// Create ZgFile and generate merkle tree
zgFile = await ZgFile.fromFilePath(tempFilePath);
const [tree, treeErr] = await zgFile.merkleTree();
const rootHash = tree.rootHash();
```

#### Step 4: Submission Data Creation
```typescript
// Create submission structure
const [submissionData, subErr] = await zgFile.createSubmission('0x');
// Contains: length, tags, nodes array with merkle proofs
```

#### Step 5: Fee Calculation
```typescript
// Get market price from Flow contract
const marketContract = new ethers.Contract(marketAddr, marketAbi, provider);
const pricePerSector = await marketContract.pricePerSector();

// Calculate fee with buffer
const sectorSize = 256;
const numSectors = Math.ceil(Number(submissionData.length) / sectorSize);
const fee = pricePerSector * BigInt(numSectors) * BigInt(2); // 2x buffer
```

#### Step 6: On-Chain Submission
```typescript
// Submit to Flow contract
const tx = await flowContract.submit(fullSubmission, {
  value: fee,
  gasLimit: 1000000,
  gasPrice: BigInt(5000000000)
});
```

#### Step 7: Data Upload to Storage Nodes
```typescript
// Upload actual data segments to storage nodes
const [uploadResult, uploadErr] = await indexer.upload(
  zgFile,
  ZG_EVM_RPC,
  signer,
  {
    tags: '0x',
    finalityRequired: true,
    taskSize: 10,
    expectedReplica: 1,
    skipTx: true, // Already submitted on-chain
    fee: BigInt(0),
  }
);
```

**Compute Complexity**:
- File I/O operations
- Cryptographic hashing (SHA-256)
- Merkle tree construction
- Network communication with storage nodes
- Transaction signing and broadcasting

---

## Client-Side Storage

### 1. Browser Local Storage

**Usage**: Session persistence, user preferences

**Example**:
```typescript
// Wallet connection state (via wagmi)
localStorage.setItem('wagmi.wallet', walletId);

// User preferences
localStorage.setItem('preferredStyle', style);
```

### 2. React State Management

**Location**: Throughout `frontend/app/generate/page.tsx`

**State Storage**:
```typescript
interface NFTImage {
  id: string;
  url: string;              // Base64 data URL
  prompt: string;
  style: string;
  title?: string;
  description?: string;
  imageHash?: string;       // 0G Storage hash
  metadataHash?: string;    // 0G Storage hash
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'uploading' | 'minting' | 'minted';
  txHash?: string;
  tokenId?: number;
}
```

**Memory Management**:
- Images stored as base64 strings in memory
- Cleared on page navigation
- No persistent cache (privacy-focused)

### 3. IndexedDB (Potential)

**Not Currently Implemented** but could be used for:
- Offline NFT drafts
- Large image caching
- Transaction history

---

## Server-Side Storage

### 1. Temporary File Storage

**Location**: `frontend/app/api/zg-storage/route.ts` (lines 73-79)

**Purpose**: Intermediate storage for 0G SDK processing

**Implementation**:
```typescript
const tempDir = join(tmpdir(), '0g-uploads');
await mkdir(tempDir, { recursive: true });

tempFilePath = join(tempDir, fileName);
await writeFile(tempFilePath, contentBuffer);

// Cleanup after upload
await unlink(tempFilePath);
```

**Lifecycle**:
1. Create temp file
2. Process with 0G SDK
3. Upload to 0G Storage
4. Delete temp file (in `finally` block)

### 2. 0G Decentralized Storage

**Primary Storage Layer** for all NFT assets

#### Configuration
```typescript
const ZG_INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';
const ZG_EVM_RPC = 'https://evmrpc-testnet.0g.ai';
const ZG_FLOW_CONTRACT = '0xbD2C3F0E65eDF5582141C35969d66e34629cC768';
```

#### Storage Architecture

**Flow Contract** (`0xbD2C3F0E65eDF5582141C35969d66e34629cC768`):
- Manages data submissions
- Tracks merkle roots on-chain
- Handles storage fees
- Emits submission events

**Storage Nodes**:
- Distributed network of storage providers
- Store actual file data
- Serve data via indexer gateway
- Replicate data for availability

#### Data Retrieval

**Gateway URL Format**:
```
https://indexer-storage-testnet-turbo.0g.ai/file?root={merkleRoot}
```

**Example**:
```typescript
export function getZGStorageUrl(root: string): string {
  return `${ZG_INDEXER_RPC}/file?root=${root}`;
}
```

#### Storage Workflow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Client sends data to API                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│ 2. Server converts to buffer & creates temp file             │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│ 3. Generate merkle tree using 0G SDK                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│ 4. Submit merkle root to Flow contract (on-chain)            │
│    - Pay storage fee in 0G tokens                            │
│    - Transaction confirmed on 0G Chain                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│ 5. Upload data segments to storage nodes                     │
│    - Nodes verify against on-chain merkle root               │
│    - Data replicated across network                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│ 6. Return merkle root to client                              │
│    - Used as permanent reference in NFT metadata             │
└──────────────────────────────────────────────────────────────┘
```

#### Storage Costs

**Fee Calculation**:
```typescript
const pricePerSector = await marketContract.pricePerSector(); // e.g., 1 gwei
const sectorSize = 256; // bytes
const numSectors = Math.ceil(fileSize / sectorSize);
const totalFee = pricePerSector * numSectors * 2; // 2x buffer for safety
```

**Example Costs** (testnet):
- Small image (100 KB): ~0.001 0G tokens
- Metadata JSON (2 KB): ~0.00002 0G tokens

### 3. Environment Variables Storage

**Location**: `.env.local` (server-side only)

**Stored Secrets**:
```bash
# AI API Keys
GEMINI_API_KEY=your_gemini_key
TOGETHER_API_KEY=your_together_key

# 0G Storage
ZG_STORAGE_PRIVATE_KEY=your_private_key  # Server wallet for storage fees

# Public Config (exposed to client)
NEXT_PUBLIC_0G_RPC=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=16602
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbcFa72f21921a4ae2bff73F505440cDAED4831C2
NEXT_PUBLIC_0G_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
```

---

## Data Flow Diagrams

### Complete NFT Minting Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Upload image
                              │ 2. Enter prompt & style
                              │ 3. Click "Generate"
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE PROCESSING                           │
├─────────────────────────────────────────────────────────────────────┤
│  • Convert image to base64                                          │
│  • Create NFT placeholders in state                                 │
│  • Extract reference image data                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/generate-image
                              │ POST /api/generate-metadata (parallel)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVER-SIDE AI COMPUTE                           │
├─────────────────────────────────────────────────────────────────────┤
│  IMAGE GENERATION:                                                  │
│  • Together.ai or Gemini API call                                   │
│  • Process prompt + style + reference                               │
│  • Generate 1024x1024 image                                         │
│  • Return base64 image                                              │
│                                                                     │
│  METADATA GENERATION:                                               │
│  • Gemini 2.5 Flash API call                                        │
│  • Generate creative title & description                            │
│  • Return structured JSON                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Return generated data
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE STATE UPDATE                         │
├─────────────────────────────────────────────────────────────────────┤
│  • Update NFT status to 'completed'                                 │
│  • Store image URL, title, description                              │
│  • Display in gallery                                               │
│  • Enable "Mint" button                                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks "Mint"
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STORAGE UPLOAD PHASE                             │
├─────────────────────────────────────────────────────────────────────┤
│  CLIENT:                                                            │
│  • POST /api/zg-storage (image)                                     │
│  • POST /api/zg-storage (metadata)                                  │
│                                                                     │
│  SERVER:                                                            │
│  • Convert base64 to buffer                                         │
│  • Write to temp file                                               │
│  • Generate merkle tree with 0G SDK                                 │
│  • Calculate storage fee                                            │
│  • Submit to Flow contract (server wallet signs)                    │
│  • Upload data to storage nodes                                     │
│  • Return merkle root hash                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Return imageHash, metadataHash
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN MINTING PHASE                         │
├─────────────────────────────────────────────────────────────────────┤
│  CLIENT:                                                            │
│  • Call mintNFT(signer, imageHash, metadataHash, style, prompt)     │
│  • User signs transaction in wallet                                 │
│                                                                     │
│  SMART CONTRACT:                                                    │
│  • Mint NFT to user's address                                       │
│  • Store NFTData struct on-chain                                    │
│  • Emit NFTMinted event                                             │
│  • Return tokenId                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Transaction confirmed
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPLETION                                  │
├─────────────────────────────────────────────────────────────────────┤
│  • Update NFT status to 'minted'                                    │
│  • Store txHash and tokenId                                         │
│  • Display success message                                          │
│  • NFT appears in user's wallet                                     │
│  • Viewable on 0G Explorer                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Parallel vs Sequential Processing

#### Image Generation (Sequential with Reference)
```
Upload Image
     │
     ▼
Generate NFT #1 (uses uploaded image as reference)
     │
     ├─── Extract generated image
     │
     ▼
Generate NFT #2 (uses NFT #1 as reference)
     │
     ▼
Generate NFT #3 (uses NFT #1 as reference)
     │
     ▼
... (all use NFT #1 for consistency)
```

#### Storage Upload (Batched Parallel)
```
Batch 1 (5 images)
├─── Upload Image 1 ──┐
├─── Upload Image 2 ──┤
├─── Upload Image 3 ──┼─── Parallel
├─── Upload Image 4 ──┤
└─── Upload Image 5 ──┘
         │
         ▼
Batch 2 (5 images)
├─── Upload Image 6 ──┐
├─── Upload Image 7 ──┤
├─── Upload Image 8 ──┼─── Parallel
├─── Upload Image 9 ──┤
└─── Upload Image 10 ─┘
```

#### Minting (Batched On-Chain)
```
Batch 1 (5 NFTs)
└─── Single transaction ──► Mints 5 NFTs with sequential token IDs

Batch 2 (5 NFTs)
└─── Single transaction ──► Mints 5 NFTs with sequential token IDs
```

---

## Smart Contract Storage

### On-Chain Data Structure

**Location**: `contracts/src/SketchNFT.sol`

**Storage Layout**:

```solidity
contract SketchNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    // Token counter (uint256)
    uint256 private _tokenIdCounter;
    
    // NFT data mapping (tokenId => NFTData)
    mapping(uint256 => NFTData) public nftData;
    
    // Storage gateway URL (string)
    string public storageGateway;
    
    // ERC721 inherited storage:
    // - mapping(uint256 => address) _owners
    // - mapping(address => uint256) _balances
    // - mapping(uint256 => address) _tokenApprovals
    // - mapping(address => mapping(address => bool)) _operatorApprovals
}
```

**NFTData Struct**:
```solidity
struct NFTData {
    string originalSketchHash;   // 0G Storage hash (32 bytes + length)
    string coloredImageHash;     // 0G Storage hash (32 bytes + length)
    string metadataHash;         // 0G Storage hash (32 bytes + length)
    string style;                // Art style (variable length)
    string prompt;               // Generation prompt (variable length)
    address creator;             // Creator address (20 bytes)
    uint256 createdAt;           // Timestamp (32 bytes)
}
```

**Gas Costs** (approximate):

| Operation | Gas Cost | USD (at $2000 ETH, 50 gwei) |
|-----------|----------|------------------------------|
| Mint single NFT | ~150,000 | $0.015 |
| Batch mint 5 NFTs | ~400,000 | $0.040 |
| Batch mint 10 NFTs | ~700,000 | $0.070 |

**Storage Optimization**:
- Hashes stored as strings (66 chars for 0x-prefixed hex)
- No image data stored on-chain (only references)
- Metadata stored off-chain on 0G Storage
- Token URI dynamically constructed from gateway + hash

### Token URI Resolution

**Function**:
```solidity
function tokenURI(uint256 tokenId) public view returns (string memory) {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");
    
    string memory metadataHash = nftData[tokenId].metadataHash;
    return string(abi.encodePacked(storageGateway, "?root=", metadataHash));
}
```

**Example Output**:
```
https://indexer-storage-testnet-turbo.0g.ai/file?root=0xabc123...
```

**Metadata JSON** (stored on 0G, not on-chain):
```json
{
  "name": "Neo-Whiskers: Circuit Purr #42",
  "description": "A cybernetic feline from the neon-lit streets of Neo-Tokyo...",
  "image": "https://indexer-storage-testnet-turbo.0g.ai/file?root=0xdef456...",
  "attributes": [
    { "trait_type": "Style", "value": "Cyberpunk Neon" },
    { "trait_type": "Generator", "value": "Gemini AI" },
    { "trait_type": "Resolution", "value": "1K" },
    { "trait_type": "Prompt", "value": "cute dragon character" }
  ]
}
```

---

## Performance Optimizations

### 1. Client-Side Optimizations

#### Image Processing
```typescript
// Efficient base64 encoding with quality control
canvas.toDataURL('image/jpeg', 0.9); // 90% quality, smaller size
```

#### Parallel API Calls
```typescript
// Generate image and metadata simultaneously
const [imageResponse, metadataResponse] = await Promise.all([
  fetch('/api/generate-image', {...}),
  fetch('/api/generate-metadata', {...})
]);
```

#### Batched State Updates
```typescript
// Update multiple NFTs in single state update
setGeneratedImages(prev => prev.map(img => 
  batch.includes(img.id) ? { ...img, status: 'uploading' } : img
));
```

### 2. Server-Side Optimizations

#### Retry Logic with Exponential Backoff
```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
  baseDelay = 3000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && isRateLimit(error)) {
      const delay = baseDelay + Math.random() * 1000;
      await wait(delay);
      return retryOperation(operation, retries - 1, baseDelay * 2);
    }
    throw error;
  }
}
```

#### Temp File Cleanup
```typescript
try {
  // Upload operations
} finally {
  // Always cleanup temp files
  if (tempFilePath) {
    await unlink(tempFilePath);
  }
}
```

#### Connection Pooling
```typescript
// Reuse provider instances
const provider = new ethers.JsonRpcProvider(ZG_EVM_RPC);
```

### 3. Storage Optimizations

#### Batched Uploads
```typescript
const UPLOAD_BATCH_SIZE = 5;
for (let i = 0; i < items.length; i += UPLOAD_BATCH_SIZE) {
  const batch = items.slice(i, i + UPLOAD_BATCH_SIZE);
  await Promise.all(batch.map(item => uploadImage(item)));
}
```

#### Fee Calculation with Buffer
```typescript
// 2x buffer to avoid failed transactions
const fee = pricePerSector * BigInt(numSectors) * BigInt(2);
```

#### Skip Redundant On-Chain Submissions
```typescript
await indexer.upload(zgFile, ZG_EVM_RPC, signer, {
  skipTx: true, // Already submitted manually
  fee: BigInt(0),
});
```

### 4. Blockchain Optimizations

#### Batch Minting
```typescript
// Mint multiple NFTs in single transaction
function batchMint(
  address to,
  string[] memory originalSketchHashes,
  string[] memory coloredImageHashes,
  string[] memory metadataHashes,
  string[] memory styles,
  string[] memory prompts
) public returns (uint256[] memory)
```

**Benefits**:
- Amortize base transaction cost across multiple NFTs
- Single signature for multiple mints
- ~40% gas savings compared to individual mints

#### Gas Limit Optimization
```typescript
const tx = await flowContract.submit(fullSubmission, {
  value: fee,
  gasLimit: 1000000,      // Sufficient but not excessive
  gasPrice: BigInt(5000000000) // 5 gwei
});
```

---

## Summary

### Compute Distribution

| Component | Location | Primary Tasks |
|-----------|----------|---------------|
| **Client Browser** | User's device | UI rendering, image capture, wallet signing |
| **Next.js Server** | Hosting provider | AI generation, 0G SDK operations, API routing |
| **AI Services** | Gemini/Together.ai | Image generation, metadata creation |
| **0G Storage Nodes** | Decentralized network | Data storage, merkle verification |
| **0G Blockchain** | Decentralized network | Smart contract execution, state management |

### Storage Distribution

| Data Type | Storage Location | Access Method | Cost |
|-----------|------------------|---------------|------|
| **User Input** | Client state | React state | Free |
| **Generated Images** | Client memory | Base64 data URLs | Free |
| **NFT Images** | 0G Storage | Gateway URL + merkle root | ~0.001 0G |
| **NFT Metadata** | 0G Storage | Gateway URL + merkle root | ~0.00002 0G |
| **NFT Ownership** | 0G Chain | Smart contract mapping | Gas fees |
| **NFT References** | 0G Chain | NFTData struct | Gas fees |
| **Temp Files** | Server filesystem | File path | Free (cleaned up) |

### Key Design Decisions

1. **Hybrid Architecture**: Client handles UI/UX, server handles heavy compute
2. **Decentralized Storage**: All assets on 0G, not IPFS or centralized servers
3. **Server-Paid Storage**: Server wallet pays 0G storage fees, user only pays minting gas
4. **Batched Operations**: Parallel uploads, batch minting for efficiency
5. **Reference-Based Generation**: First image becomes template for consistency
6. **Two-Signature Flow**: Storage upload + NFT minting (when using client-side storage)
7. **Fallback Providers**: Together.ai (free) → Gemini (paid) for AI generation

---

## Environment Setup

### Required Environment Variables

```bash
# AI Generation (choose one or both)
TOGETHER_API_KEY=your_together_key          # Free tier available
GEMINI_API_KEY=your_gemini_key              # Requires billing

# 0G Storage (server-side)
ZG_STORAGE_PRIVATE_KEY=your_private_key     # Funded wallet for storage fees

# 0G Network (public, exposed to client)
NEXT_PUBLIC_0G_RPC=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=16602
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbcFa72f21921a4ae2bff73F505440cDAED4831C2
NEXT_PUBLIC_0G_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_0G_GATEWAY=https://indexer-storage-testnet-turbo.0g.ai
```

### Wallet Requirements

1. **User Wallet**: Needs 0G tokens for minting gas fees
2. **Server Wallet**: Needs 0G tokens for storage fees (auto-paid by server)

---

## Conclusion

This architecture demonstrates a modern Web3 application with:
- **Decentralized storage** (0G) instead of centralized servers
- **AI-powered compute** for creative content generation
- **Efficient batching** for cost optimization
- **Hybrid client-server** model for best UX
- **Production-ready** error handling and retry logic

The system is designed to scale horizontally (more API servers) and vertically (better AI models) while maintaining decentralization for asset storage and ownership.
