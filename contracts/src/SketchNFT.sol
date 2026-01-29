// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SketchNFT
 * @notice AI-Generated NFTs with 0G Storage Integration
 * @dev Stores references to images and metadata on 0G decentralized storage
 *
 * Flow:
 * 1. User draws sketch on paper
 * 2. Gemini AI colorizes and creates variations
 * 3. Images uploaded to 0G Storage → get storage hashes
 * 4. Metadata JSON uploaded to 0G Storage → get metadata hash
 * 5. NFT minted with storage references on-chain
 */
contract SketchNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Strings for uint256;

    // Token counter
    uint256 private _tokenIdCounter;

    // Struct to store NFT generation details
    struct NFTData {
        string originalSketchHash;   // 0G Storage hash of original sketch
        string coloredImageHash;     // 0G Storage hash of AI-colored image
        string metadataHash;         // 0G Storage hash of metadata JSON
        string style;                // Art style used (Anime, Watercolor, etc.)
        string prompt;               // Generation prompt
        address creator;             // Original creator address
        uint256 createdAt;           // Timestamp of creation
    }

    // Mapping from token ID to NFT data
    mapping(uint256 => NFTData) public nftData;

    // Base URI for 0G Storage gateway
    string public storageGateway;

    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string originalSketchHash,
        string coloredImageHash,
        string metadataHash,
        string style
    );

    event BatchMinted(
        address indexed creator,
        uint256[] tokenIds,
        uint256 count
    );

    event StorageGatewayUpdated(string oldGateway, string newGateway);

    /**
     * @notice Constructor
     * @param _storageGateway Base URL for 0G Storage gateway (e.g., "https://gateway.0g.ai")
     */
    constructor(string memory _storageGateway)
        ERC721("SketchToNFT", "SKETCH")
        Ownable(msg.sender)
    {
        storageGateway = _storageGateway;
    }

    /**
     * @notice Mint a single NFT
     * @param to Recipient address
     * @param originalSketchHash 0G Storage hash of original sketch
     * @param coloredImageHash 0G Storage hash of AI-colored image
     * @param metadataHash 0G Storage hash of metadata JSON
     * @param style Art style used
     * @param prompt Generation prompt
     * @return tokenId The minted token ID
     */
    function mint(
        address to,
        string memory originalSketchHash,
        string memory coloredImageHash,
        string memory metadataHash,
        string memory style,
        string memory prompt
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        // Store NFT data
        nftData[tokenId] = NFTData({
            originalSketchHash: originalSketchHash,
            coloredImageHash: coloredImageHash,
            metadataHash: metadataHash,
            style: style,
            prompt: prompt,
            creator: msg.sender,
            createdAt: block.timestamp
        });

        // Set token URI to metadata hash (can be resolved via gateway)
        _setTokenURI(tokenId, metadataHash);

        emit NFTMinted(
            tokenId,
            msg.sender,
            originalSketchHash,
            coloredImageHash,
            metadataHash,
            style
        );

        return tokenId;
    }

    /**
     * @notice Batch mint multiple NFTs (for collection launches)
     * @param to Recipient address
     * @param originalSketchHashes Array of original sketch hashes
     * @param coloredImageHashes Array of colored image hashes
     * @param metadataHashes Array of metadata hashes
     * @param styles Array of styles
     * @param prompts Array of prompts
     * @return tokenIds Array of minted token IDs
     */
    function batchMint(
        address to,
        string[] memory originalSketchHashes,
        string[] memory coloredImageHashes,
        string[] memory metadataHashes,
        string[] memory styles,
        string[] memory prompts
    ) public returns (uint256[] memory) {
        require(
            originalSketchHashes.length == coloredImageHashes.length &&
            coloredImageHashes.length == metadataHashes.length &&
            metadataHashes.length == styles.length &&
            styles.length == prompts.length,
            "Array lengths must match"
        );

        uint256 count = originalSketchHashes.length;
        uint256[] memory tokenIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = mint(
                to,
                originalSketchHashes[i],
                coloredImageHashes[i],
                metadataHashes[i],
                styles[i],
                prompts[i]
            );
        }

        emit BatchMinted(msg.sender, tokenIds, count);

        return tokenIds;
    }

    /**
     * @notice Get full image URL from storage hash
     * @param storageHash The 0G Storage hash
     * @return Full URL to access the image
     */
    function getImageUrl(string memory storageHash) public view returns (string memory) {
        return string(abi.encodePacked(storageGateway, "/", storageHash));
    }

    /**
     * @notice Get all data for an NFT
     * @param tokenId The token ID
     * @return NFT data struct
     */
    function getNFTData(uint256 tokenId) public view returns (NFTData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return nftData[tokenId];
    }

    /**
     * @notice Get NFTs owned by an address
     * @param owner The owner address
     * @return Array of token IDs
     */
    function getTokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokens;
    }

    /**
     * @notice Update storage gateway URL (owner only)
     * @param _newGateway New gateway URL
     */
    function setStorageGateway(string memory _newGateway) public onlyOwner {
        string memory oldGateway = storageGateway;
        storageGateway = _newGateway;
        emit StorageGatewayUpdated(oldGateway, _newGateway);
    }

    /**
     * @notice Get total supply of NFTs
     * @return Total number of NFTs minted
     */
    function totalMinted() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // ============ Required Overrides ============

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        // Return full URL to metadata
        string memory metadataHash = nftData[tokenId].metadataHash;
        return string(abi.encodePacked(storageGateway, "/", metadataHash));
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
