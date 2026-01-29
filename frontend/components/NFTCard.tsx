'use client';

import { motion } from 'framer-motion';
import { Loader2, Check, AlertCircle, RefreshCcw, Code, ExternalLink, Database } from 'lucide-react';
import Image from 'next/image';

interface NFTCardProps {
  nft: {
    id: string;
    url: string;
    title?: string;
    description?: string;
    prompt: string;
    style: string;
    status: 'pending' | 'generating' | 'completed' | 'failed' | 'uploading' | 'minting' | 'minted';
    imageHash?: string;
    metadataHash?: string;
    txHash?: string;
    tokenId?: number;
  };
  onRegenerate?: () => void;
  onViewMetadata?: () => void;
}

export function NFTCard({ nft, onRegenerate, onViewMetadata }: NFTCardProps) {
  const getExplorerUrl = (txHash: string) => {
    return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
  };

  const getTokenExplorerUrl = (tokenId: number) => {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xbcFa72f21921a4ae2bff73F505440cDAED4831C2';
    return `https://chainscan-galileo.0g.ai/token/${contractAddress}?a=${tokenId}`;
  };

  const statusConfig = {
    generating: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Generating' },
    uploading: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Uploading' },
    minting: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Minting' },
    minted: { bg: 'bg-green-50', text: 'text-green-700', label: 'Minted' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
  };

  const currentStatus = statusConfig[nft.status as keyof typeof statusConfig];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-lg hover:shadow-lg transition-all duration-300 group"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 0, 0, 0.1)' }}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
        {nft.url ? (
          <>
            <Image
              src={nft.url}
              alt={nft.title || 'NFT'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  onClick={onViewMetadata}
                  className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                  title="View Metadata"
                >
                  <Code size={16} />
                </button>
                {nft.status !== 'minted' && nft.status !== 'minting' && (
                  <button
                    onClick={onRegenerate}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                    title="Regenerate"
                  >
                    <RefreshCcw size={16} />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            {nft.status === 'generating' ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-gray-600 animate-spin" />
                <span className="text-xs font-medium text-gray-700">Generating...</span>
              </div>
            ) : nft.status === 'failed' ? (
              <div className="flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <button
                  onClick={onRegenerate}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-medium hover:bg-gray-800 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <span className="text-gray-400 text-xs font-medium">Waiting...</span>
            )}
          </div>
        )}

        {/* Status Badge */}
        {currentStatus && (
          <div className="absolute top-3 left-3">
            <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${currentStatus.bg}`}>
              {nft.status === 'generating' || nft.status === 'uploading' || nft.status === 'minting' ? (
                <Loader2 size={12} className="animate-spin" strokeWidth={2.5} />
              ) : nft.status === 'minted' ? (
                <Check size={12} strokeWidth={2.5} />
              ) : nft.status === 'failed' ? (
                <AlertCircle size={12} strokeWidth={2.5} />
              ) : null}
              <span className={`text-[10px] font-medium ${currentStatus.text}`}>{currentStatus.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {nft.title ? (
          <h3 className="text-base font-medium line-clamp-1 text-gray-900">{nft.title}</h3>
        ) : (
          <div className="space-y-2 animate-pulse">
            <div className="h-5 w-4/5 rounded bg-gray-200" />
          </div>
        )}

        {/* 0G Explorer Links */}
        {(nft.txHash || nft.tokenId !== undefined) && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              {nft.txHash && (
                <a
                  href={getExplorerUrl(nft.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors text-gray-700"
                >
                  TX <ExternalLink size={10} />
                </a>
              )}

              {nft.tokenId !== undefined && (
                <a
                  href={getTokenExplorerUrl(nft.tokenId)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1.5 px-2 bg-gray-900 hover:bg-gray-800 text-white rounded font-medium transition-colors"
                >
                  NFT #{nft.tokenId} <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
