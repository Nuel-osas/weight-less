'use client';

import { motion } from 'framer-motion';
import { useWallet } from '@/components/providers';

export function CustomConnectButton() {
  const { address, isConnecting, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`.toLowerCase();
  };

  if (address) {
    return (
      <motion.button
        whileHover={{ scale: 1.02, opacity: 0.9 }}
        whileTap={{ scale: 0.98 }}
        onClick={disconnect}
        className="px-8 py-3.5 font-semibold text-base tracking-wider transition-all rounded-full shadow-lg backdrop-blur-xl border border-white/30"
        style={{ backgroundColor: '#36454F', color: '#FFFFFF' }}
      >
        {formatAddress(address)}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, opacity: 0.9 }}
      whileTap={{ scale: 0.98 }}
      onClick={connect}
      disabled={isConnecting}
      className="px-8 py-3.5 font-semibold text-base uppercase tracking-wider transition-all rounded-full shadow-lg backdrop-blur-xl border border-white/30 disabled:opacity-50"
      style={{ backgroundColor: '#36454F', color: '#FFFFFF' }}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </motion.button>
  );
}
