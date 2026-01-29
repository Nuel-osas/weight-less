'use client';

import { ReactNode, useState, useEffect } from 'react';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Define 0G Testnet chain
const zgTestnet = {
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: {
    name: '0G',
    symbol: '0G',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
} as const;

// Create wagmi config with RainbowKit
const config = getDefaultConfig({
  appName: 'Sketch to NFT',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [zgTestnet],
  transports: {
    [zgTestnet.id]: http('https://evmrpc-testnet.0g.ai'),
  },
  ssr: true,
});

// Create query client outside component
const queryClient = new QueryClient();

export function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? (
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#36454F',
              accentColorForeground: 'white',
              borderRadius: 'large',
            })}
            modalSize="compact"
          >
            {children}
          </RainbowKitProvider>
        ) : (
          children
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
