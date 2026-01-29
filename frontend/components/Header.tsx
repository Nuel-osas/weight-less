'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CustomConnectButton } from '@/components/CustomConnectButton';

export function Header() {
  const pathname = usePathname();
  const isGeneratePage = pathname === '/generate';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center group">
            <span className="font-bold text-4xl tracking-wider transition-colors group-hover:opacity-90" style={{ color: '#36454F', fontFamily: 'var(--font-lilita)' }}>
              SketchNFT
            </span>
          </Link>
        </div>

        {/* Right side - Navigation + Connect Button */}
        <div className="flex items-center gap-8">
          {/* Navigation - Hidden on generate page */}
          {!isGeneratePage && (
            <nav className="hidden md:flex items-center gap-8 text-gray-700 font-medium text-sm tracking-wider uppercase">
              <Link href="/collection" className="hover:text-gray-900 transition-colors">Collection</Link>
              <Link href="/generate" className="hover:text-gray-900 transition-colors">Create</Link>
            </nav>
          )}

          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              <CustomConnectButton />
            </div>
            {!isGeneratePage && (
              <button className="md:hidden text-gray-900">
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
