'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function CustomConnectButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted (after RainbowKitProvider is ready)
  if (!mounted) {
    return (
      <button
        className="px-8 py-3.5 font-semibold text-base uppercase tracking-wider transition-all rounded-full shadow-lg backdrop-blur-xl border border-white/30 opacity-50"
        style={{ backgroundColor: '#36454F', color: '#FFFFFF' }}
        disabled
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="px-8 py-3.5 font-semibold text-base uppercase tracking-wider transition-all rounded-full shadow-lg backdrop-blur-xl border border-white/30 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: '#36454F', color: '#FFFFFF' }}
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="px-8 py-3.5 font-semibold text-base tracking-wider transition-all rounded-full shadow-lg border border-red-500/30 hover:opacity-90"
                    style={{ backgroundColor: '#ef4444', color: '#FFFFFF' }}
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="px-8 py-3.5 font-semibold text-base tracking-wider transition-all rounded-full shadow-lg backdrop-blur-xl border border-white/30 flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: '#36454F', color: '#FFFFFF' }}
                >
                  {account.displayName}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
