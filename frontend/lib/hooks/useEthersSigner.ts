'use client';

import { useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletClient } from 'viem';

/**
 * Convert a viem WalletClient to an ethers.js Signer
 */
function walletClientToSigner(walletClient: WalletClient): JsonRpcSigner {
  const { account, chain, transport } = walletClient;

  const network = {
    chainId: chain?.id ?? 1,
    name: chain?.name ?? 'unknown',
    ensAddress: undefined,
  };

  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account?.address ?? '');

  return signer;
}

/**
 * Hook to get an ethers.js Signer from wagmi
 */
export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!walletClient) return undefined;
    return walletClientToSigner(walletClient);
  }, [walletClient]);
}
