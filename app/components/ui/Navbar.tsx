'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { Badge } from './Badge';
import { 
  Sparkles, 
  Menu, 
  X, 
  Search, 
  Bell, 
  Settings, 
  User,
  Moon,
  Sun,
  Activity,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

interface NavbarProps {
  onThemeToggle?: () => void;
  isDark?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onThemeToggle, isDark = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Explorer', href: '/', icon: Search },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Security', href: '/security', icon: Shield },
    { name: 'Gas Tracker', href: '/gas', icon: Zap },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                AvaScanAI
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Enterprise Intelligence</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                size="sm"
                className="text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Button>
            ))}
          </div>

          {/* Network Status */}
          <div className="hidden sm:flex items-center space-x-3">
            <Badge variant="success" className="animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
            <Badge variant="outline" className="text-xs">
              Mainnet
            </Badge>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              className="hidden sm:flex"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Bell className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Settings className="w-4 h-4" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50"
        >
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="w-full justify-start text-gray-700 dark:text-gray-300"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Button>
            ))}
            <div className="flex items-center space-x-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onThemeToggle}>
                {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                Theme
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;