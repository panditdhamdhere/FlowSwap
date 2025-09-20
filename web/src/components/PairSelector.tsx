import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingPairs, type TradingPair } from '../hooks/useTradingPairs';

interface PairSelectorProps {
  className?: string;
  onPairSelect?: (pair: TradingPair) => void;
}

const PairSelector: React.FC<PairSelectorProps> = ({ className = '', onPairSelect }) => {
  const {
    selectedPair,
    activePairs,
    popularPairs,
    trendingPairs,
    switchPair,
    formatPairName,
    getPairPrice,
  } = useTradingPairs();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'trending'>('all');

  const handlePairSelect = (pair: TradingPair) => {
    switchPair(pair.id);
    onPairSelect?.(pair);
    setIsOpen(false);
  };

  const getDisplayPairs = () => {
    switch (activeTab) {
      case 'popular':
        return popularPairs;
      case 'trending':
        return trendingPairs;
      default:
        return activePairs;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
  };

  const formatPriceChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Pair Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {selectedPair?.tokenA.symbol.charAt(0)}
            </div>
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold -ml-2">
              {selectedPair?.tokenB.symbol.charAt(0)}
            </div>
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-800 dark:text-gray-200">
              {selectedPair ? formatPairName(selectedPair) : 'Select Pair'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedPair ? `$${getPairPrice(selectedPair.id).toFixed(6)}` : 'Choose trading pair'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedPair && (
            <div className="text-right">
              <div className={`text-sm font-medium ${getPriceChangeColor(selectedPair.priceChange24h)}`}>
                {formatPriceChange(selectedPair.priceChange24h)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatVolume(selectedPair.volume24h)}
              </div>
            </div>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'all', label: 'All Pairs' },
                { key: 'popular', label: 'Popular' },
                { key: 'trending', label: 'Trending' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pairs List */}
            <div className="max-h-80 overflow-y-auto">
              {getDisplayPairs().length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No pairs available
                </div>
              ) : (
                <div className="p-2">
                  {getDisplayPairs().map((pair) => (
                    <motion.button
                      key={pair.id}
                      onClick={() => handlePairSelect(pair)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedPair?.id === pair.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {pair.tokenA.symbol.charAt(0)}
                          </div>
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold -ml-1">
                            {pair.tokenB.symbol.charAt(0)}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">
                            {formatPairName(pair)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {pair.tokenA.name} / {pair.tokenB.name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          ${getPairPrice(pair.id).toFixed(6)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-medium ${getPriceChangeColor(pair.priceChange24h)}`}>
                            {formatPriceChange(pair.priceChange24h)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatVolume(pair.volume24h)}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {getDisplayPairs().length} pairs available
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PairSelector;
