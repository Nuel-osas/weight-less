'use client';

import { useEffect, useState } from 'react';
import { useWalletClient } from 'wagmi';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletClient } from 'viem';

/**
 * Convert a viem WalletClient to an ethers.js Signer
 */
async function walletClientToSigner(walletClient: WalletClient): Promise<JsonRpcSigner> {
  const { account, chain, transport } = walletClient;

  const network = {
    chainId: chain?.id ?? 1,
    name: chain?.name ?? 'unknown',
    ensAddress: undefined,
  };

  const provider = new BrowserProvider(transport, network);
  // Use getSigner() instead of direct instantiation for proper initialization
  const signer = await provider.getSigner(account?.address);

  return signer;
}

/**
 * Hook to get an ethers.js Signer from wagmi
 */
export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);

  useEffect(() => {
    if (!walletClient) {
      setSigner(undefined);
      return;
    }

    walletClientToSigner(walletClient)
      .then(setSigner)
      .catch((err) => {
        console.error('[useEthersSigner] Failed to create signer:', err);
        setSigner(undefined);
      });
  }, [walletClient]);

  return signer;
}
