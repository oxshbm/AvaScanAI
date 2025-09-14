import React from 'react';
import Image from 'next/image';
import { Github, Twitter, FileText, DollarSign } from 'lucide-react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/logo.png" alt="StarkScanAI Logo" width={32} height={32} className="rounded-xl" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  StarkScanAI
                </h1>
                <p className="text-xs text-gray-500">Powered by Pragma Oracle</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
                Explorer
              </Link>
              <Link href="/pragma-feeds" className="text-gray-700 hover:text-purple-600 font-medium transition-colors flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Price Feeds
              </Link>
              <Link href="/analytics" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
                Analytics
              </Link>
              <Link href="/docs" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
                Docs
              </Link>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Pragma Status */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full absolute top-0 animate-ping"></div>
              </div>
              <span className="text-sm font-medium text-green-700">Pragma Active</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              <a 
                href="https://github.com/yourusername/starkscanai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/starkscanai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
