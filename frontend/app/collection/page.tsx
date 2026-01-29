'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { Loader2, ExternalLink, Grid, List, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { getTotalMinted, getNFTData, getContractConfig, getTokenExplorerUrl } from '@/lib/services/contractService';
import { getStorageUrl } from '@/lib/services/storageService';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface CollectionNFT {
  tokenId: number;
  imageHash: string;
  metadataHash: string;
  style: string;
  prompt: string;
  creator: string;
  createdAt: number;
  metadata?: NFTMetadata;
  imageUrl?: string;
}

export default function CollectionPage() {
  const [nfts, setNfts] = useState<CollectionNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalMinted, setTotalMinted] = useState(0);

  const contractConfig = getContractConfig();

  const loadCollection = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_0G_RPC || 'https://evmrpc-testnet.0g.ai');

      // Get total minted count
      const total = await getTotalMinted(provider);
      setTotalMinted(total);

      if (total === 0) {
        setNfts([]);
        setLoading(false);
        return;
      }

      // Load all NFTs (newest first)
      const nftPromises: Promise<CollectionNFT | null>[] = [];

      for (let i = total - 1; i >= 0; i--) {
        nftPromises.push(
          (async () => {
            try {
              const data = await getNFTData(provider, i);
              return {
                tokenId: i,
                imageHash: data.coloredImageHash,
                metadataHash: data.metadataHash,
                style: data.style,
                prompt: data.prompt,
                creator: data.creator,
                createdAt: data.createdAt,
              };
            } catch (err) {
              console.error(`Failed to load NFT #${i}:`, err);
              return null;
            }
          })()
        );
      }

      const results = await Promise.all(nftPromises);
      const validNfts = results.filter((n): n is CollectionNFT => n !== null);

      // Load metadata for each NFT
      const nftsWithMetadata = await Promise.all(
        validNfts.map(async (nft) => {
          try {
            if (nft.metadataHash) {
              const metadataUrl = getStorageUrl(nft.metadataHash);
              const response = await fetch(metadataUrl);
              if (response.ok) {
                const metadata = await response.json();
                return {
                  ...nft,
                  metadata,
                  imageUrl: metadata.image || getStorageUrl(nft.imageHash),
                };
              }
            }
            return {
              ...nft,
              imageUrl: getStorageUrl(nft.imageHash),
            };
          } catch (err) {
            console.error(`Failed to load metadata for NFT #${nft.tokenId}:`, err);
            return {
              ...nft,
              imageUrl: getStorageUrl(nft.imageHash),
            };
          }
        })
      );

      setNfts(nftsWithMetadata);
    } catch (err) {
      console.error('Failed to load collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollection();
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/background2.jpg?v=4)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />

        <main className="pt-24 pb-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-lilita)' }}>
                    NFT Collection
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {totalMinted} NFT{totalMinted !== 1 ? 's' : ''} minted on 0G Chain
                  </p>
                  <a
                    href={`https://chainscan-galileo.0g.ai/address/${contractConfig.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    View Contract <ExternalLink size={14} />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  {/* Refresh Button */}
                  <button
                    onClick={loadCollection}
                    disabled={loading}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                  </button>

                  {/* View Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                      }`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                      }`}
                    >
                      <List size={18} />
                    </button>
                  </div>

                  {/* Create Button */}
                  <Link href="/generate">
                    <button
                      className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors"
                      style={{ backgroundColor: '#36454F' }}
                    >
                      Create NFT
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                <p className="text-gray-600">Loading collection...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadCollection}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && nfts.length === 0 && (
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-12 text-center shadow-lg">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No NFTs Yet</h2>
                <p className="text-gray-600 mb-6">Be the first to create an NFT in this collection!</p>
                <Link href="/generate">
                  <button
                    className="px-6 py-3 rounded-xl font-medium text-white transition-colors"
                    style={{ backgroundColor: '#36454F' }}
                  >
                    Create Your First NFT
                  </button>
                </Link>
              </div>
            )}

            {/* Grid View */}
            {!loading && !error && nfts.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {nfts.map((nft, index) => (
                  <motion.div
                    key={nft.tokenId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-gray-100">
                      {nft.imageUrl ? (
                        <Image
                          src={nft.imageUrl}
                          alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        </div>
                      )}

                      {/* Token ID Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-full">
                          #{nft.tokenId}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {nft.metadata?.name || `SketchNFT #${nft.tokenId}`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {nft.style}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {formatDate(nft.createdAt)}
                        </span>
                        <a
                          href={getTokenExplorerUrl(nft.tokenId)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          View <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* List View */}
            {!loading && !error && nfts.length > 0 && viewMode === 'list' && (
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        NFT
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                        Style
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                        Creator
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {nfts.map((nft, index) => (
                      <motion.tr
                        key={nft.tokenId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {nft.imageUrl ? (
                                <Image
                                  src={nft.imageUrl}
                                  alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {nft.metadata?.name || `SketchNFT #${nft.tokenId}`}
                              </p>
                              <p className="text-xs text-gray-500">Token #{nft.tokenId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {nft.style}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-gray-600 font-mono">
                            {formatAddress(nft.creator)}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="text-sm text-gray-600">
                            {formatDate(nft.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={getTokenExplorerUrl(nft.tokenId)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            View <ExternalLink size={12} />
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
