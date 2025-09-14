import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white font-bold text-lg mb-4">StarkScanAI</h3>
            <p className="text-gray-400 mb-4">
              The first AI-powered blockchain explorer with real-time DeFi insights. 
              Enhanced with Pragma Oracle for live price feeds and advanced analytics.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://pragma.build" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <span>Powered by Pragma</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
              </li>
              <li>
                <a href="/api" className="hover:text-white transition-colors">API Reference</a>
              </li>
              <li>
                <a href="/pragma-feeds" className="hover:text-white transition-colors">Price Feeds</a>
              </li>
              <li>
                <a href="https://github.com/yourusername/starkscanai" className="hover:text-white transition-colors">GitHub</a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://starknet.io" className="hover:text-white transition-colors">Avalanche</a>
              </li>
              <li>
                <a href="https://pragma.build" className="hover:text-white transition-colors">Pragma Oracle</a>
              </li>
              <li>
                <a href="/hackathon" className="hover:text-white transition-colors">Hackathon Info</a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors">Contact Us</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © 2024 StarkScanAI. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-1 mt-4 md:mt-0">
            Built with <Heart className="w-4 h-4 text-red-500" /> for Avalanche Hackathon: Re ignite
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;