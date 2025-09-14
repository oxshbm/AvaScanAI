'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { cn } from '@/app/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
  suggestions?: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Enter transaction hash for detailed AI analysis...',
  loading = false,
  className,
  suggestions = [],
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (suggestions.length > 0 && isFocused && value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, isFocused, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const getStatusInfo = () => {
    if (loading) {
      return {
        icon: Loader2,
        text: 'Analyzing transaction...',
        color: 'text-blue-600',
        animate: 'animate-spin',
      };
    }
    if (value.length > 0) {
      return {
        icon: Sparkles,
        text: 'Ready to analyze',
        color: 'text-green-600',
        animate: 'animate-pulse',
      };
    }
    return {
      icon: Search,
      text: 'Waiting for input',
      color: 'text-gray-400',
      animate: 'animate-pulse',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={cn('relative w-full max-w-4xl mx-auto', className)}>
      <form onSubmit={onSubmit} className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl transition-all duration-300',
            isFocused
              ? 'ring-2 ring-purple-500 shadow-2xl shadow-purple-500/25'
              : 'ring-1 ring-gray-200 dark:ring-gray-700'
          )}
        >
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>

          {/* Main Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            disabled={loading}
            className={cn(
              'w-full pl-14 pr-40 py-5 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl focus:outline-none text-lg font-medium',
              loading && 'cursor-not-allowed'
            )}
          />

          {/* Action Button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Button
              type="submit"
              disabled={loading || !value.trim()}
              className={cn(
                'px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg transition-all duration-300',
                loading || !value.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-xl hover:shadow-purple-500/25'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {/* Animated Border */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl opacity-0 -z-10"
            animate={{
              opacity: isFocused ? 0.1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-10"
            >
              <div className="p-2">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onChange(suggestion)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {suggestion}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Status Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 flex items-center justify-center gap-8 text-sm"
      >
        <div className="flex items-center gap-2">
          <statusInfo.icon className={cn('w-4 h-4', statusInfo.color, statusInfo.animate)} />
          <span className={cn('font-medium', statusInfo.color)}>
            {statusInfo.text}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">AI-Powered</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-green-600" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">USD Values</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Gas Insights</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SearchBar;