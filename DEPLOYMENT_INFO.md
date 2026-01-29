# SketchNFT Deployment Info

## Contract Details

| Field | Value |
|-------|-------|
| **Contract Name** | SketchNFT |
| **Contract Address** | `0xbcFa72f21921a4ae2bff73F505440cDAED4831C2` |
| **Deployer** | `0xaE91aC6953E3619bF284f0Bfe18b08F8284fca05` |
| **Deploy TX** | `0x9076331718e536e13a992898dcaf023d029e299bc103a0bddb929c4257d92f24` |
| **Network** | 0G Testnet (Galileo) |

## Network Config

| Field | Value |
|-------|-------|
| **RPC URL** | `https://evmrpc-testnet.0g.ai` |
| **Chain ID** | `16602` |
| **Currency** | 0G |
| **Explorer** | `https://chainscan-galileo.0g.ai` |

## Storage Config

| Field | Value |
|-------|-------|
| **Gateway URL** | `https://indexer-testnet.0g.ai` |
| **Indexer URL** | `https://indexer-testnet.0g.ai` |

## Contract Functions

### Mint Single NFT
```solidity
function mint(
    address to,
    string memory originalSketchHash,
    string memory coloredImageHash,
    string memory metadataHash,
    string memory style,
    string memory prompt
) public returns (uint256)
```

### Batch Mint
```solidity
function batchMint(
    address to,
    string[] memory originalSketchHashes,
    string[] memory coloredImageHashes,
    string[] memory metadataHashes,
    string[] memory styles,
    string[] memory prompts
) public returns (uint256[] memory)
```

### Read Functions
```solidity
function getNFTData(uint256 tokenId) → NFTData
function getTokensOfOwner(address owner) → uint256[]
function tokenURI(uint256 tokenId) → string
function totalMinted() → uint256
```

## Frontend Environment Variables

Copy to `frontend/.env.local`:

```bash
# 0G Network
NEXT_PUBLIC_0G_RPC=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_0G_CHAIN_ID=16602
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbcFa72f21921a4ae2bff73F505440cDAED4831C2

# 0G Storage
NEXT_PUBLIC_0G_GATEWAY=https://indexer-testnet.0g.ai
NEXT_PUBLIC_0G_INDEXER=https://indexer-testnet.0g.ai

# Gemini AI (get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key
```

## Explorer Links

- **Contract**: https://chainscan-galileo.0g.ai/address/0xbcFa72f21921a4ae2bff73F505440cDAED4831C2
- **Deploy TX**: https://chainscan-galileo.0g.ai/tx/0x9076331718e536e13a992898dcaf023d029e299bc103a0bddb929c4257d92f24

## Test Mint Info

| Field | Value |
|-------|-------|
| **Token ID** | 0 |
| **Mint TX** | `0x1f5de9df37bc47893877254d00a356e6e391af825d63b87aa40f5966594a3c7f` |
| **Gas Used** | 314,935 |
| **Gas Price** | 2.5 gwei |
| **Cost** | ~0.00079 0G |

## Mint Command (CLI)

```bash
source .env && cast send $CONTRACT_ADDRESS \
  "mint(address,string,string,string,string,string)" \
  YOUR_ADDRESS \
  "originalHash" \
  "coloredHash" \
  "metadataHash" \
  "Style" \
  "Prompt" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --gas-price 2500000000
```
