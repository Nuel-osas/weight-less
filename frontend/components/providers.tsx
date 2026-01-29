'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// 0G Network Config
const CHAIN_CONFIG = {
  chainId: '0x40DA', // 16602 in hex
  chainName: '0G Testnet',
  rpcUrls: ['https://evmrpc-testnet.0g.ai'],
  nativeCurrency: {
    name: '0G',
    symbol: '0G',
    decimals: 18,
  },
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
};

interface WalletContextType {
  address: string | null;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  signer: null,
  provider: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts && accounts.length > 0) {
          await connect();
        }
      }
    };
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accs: unknown) => {
        const accounts = accs as string[];
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Try to switch to 0G network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        // Chain not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CHAIN_CONFIG],
          });
        } else {
          throw switchError;
        }
      }

      // Create provider and signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const walletSigner = await browserProvider.getSigner();
      const walletAddress = await walletSigner.getAddress();

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAddress(walletAddress);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setSigner(null);
    setProvider(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        signer,
        provider,
        isConnecting,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
