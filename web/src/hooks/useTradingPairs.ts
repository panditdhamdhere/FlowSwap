import { useState, useEffect, useMemo } from 'react';
import { usePairData } from './usePairData';

export interface TradingPair {
  id: string;
  name: string;
  symbol: string;
  tokenA: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
  };
  tokenB: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
  };
  isActive: boolean;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
}

// Mock trading pairs data - in a real app, this would come from the blockchain
const MOCK_PAIRS: TradingPair[] = [
  {
    id: 'flow-usdc',
    name: 'FLOW/USDC',
    symbol: 'FLOW-USDC',
    tokenA: {
      name: 'Flow Token',
      symbol: 'FLOW',
      address: '0x7e60df042a9c0868',
      decimals: 8,
    },
    tokenB: {
      name: 'USD Coin',
      symbol: 'USDC',
      address: '0xa983fecbed621163',
      decimals: 6,
    },
    isActive: true,
    volume24h: 125000,
    priceChange24h: 2.5,
    liquidity: 500000,
  },
  {
    id: 'flow-usdt',
    name: 'FLOW/USDT',
    symbol: 'FLOW-USDT',
    tokenA: {
      name: 'Flow Token',
      symbol: 'FLOW',
      address: '0x7e60df042a9c0868',
      decimals: 8,
    },
    tokenB: {
      name: 'Tether USD',
      symbol: 'USDT',
      address: '0x3c5959b568896393',
      decimals: 6,
    },
    isActive: true,
    volume24h: 85000,
    priceChange24h: -1.2,
    liquidity: 300000,
  },
  {
    id: 'usdc-usdt',
    name: 'USDC/USDT',
    symbol: 'USDC-USDT',
    tokenA: {
      name: 'USD Coin',
      symbol: 'USDC',
      address: '0xa983fecbed621163',
      decimals: 6,
    },
    tokenB: {
      name: 'Tether USD',
      symbol: 'USDT',
      address: '0x3c5959b568896393',
      decimals: 6,
    },
    isActive: true,
    volume24h: 200000,
    priceChange24h: 0.1,
    liquidity: 800000,
  },
  {
    id: 'flow-btc',
    name: 'FLOW/BTC',
    symbol: 'FLOW-BTC',
    tokenA: {
      name: 'Flow Token',
      symbol: 'FLOW',
      address: '0x7e60df042a9c0868',
      decimals: 8,
    },
    tokenB: {
      name: 'Bitcoin',
      symbol: 'BTC',
      address: '0x5d0b4b3b4b3b4b3b',
      decimals: 8,
    },
    isActive: false, // Not yet available
    volume24h: 0,
    priceChange24h: 0,
    liquidity: 0,
  },
];

export const useTradingPairs = () => {
  const [pairs, setPairs] = useState<TradingPair[]>(MOCK_PAIRS);
  const [selectedPairId, setSelectedPairId] = useState<string>('flow-usdc');
  const { pairData } = usePairData();

  // Get the currently selected pair
  const selectedPair = useMemo(() => {
    return pairs.find(pair => pair.id === selectedPairId) || pairs[0];
  }, [pairs, selectedPairId]);

  // Get active pairs only
  const activePairs = useMemo(() => {
    return pairs.filter(pair => pair.isActive);
  }, [pairs]);

  // Get pairs sorted by volume (most popular first)
  const popularPairs = useMemo(() => {
    return [...activePairs].sort((a, b) => b.volume24h - a.volume24h);
  }, [activePairs]);

  // Get pairs sorted by price change (best performers first)
  const trendingPairs = useMemo(() => {
    return [...activePairs].sort((a, b) => b.priceChange24h - a.priceChange24h);
  }, [activePairs]);

  // Update pair data with real-time information
  useEffect(() => {
    if (pairData && selectedPair) {
      setPairs(prev => prev.map(pair => {
        if (pair.id === selectedPairId) {
          return {
            ...pair,
            liquidity: (pairData.reserveA + pairData.reserveB) * pairData.priceA,
            // Update volume and price change based on real data
            volume24h: pair.volume24h + Math.random() * 1000, // Simulate volume growth
            priceChange24h: Math.random() * 10 - 5, // Simulate price change
          };
        }
        return pair;
      }));
    }
  }, [pairData, selectedPairId, selectedPair]);

  // Switch to a different pair
  const switchPair = (pairId: string) => {
    const pair = pairs.find(p => p.id === pairId);
    if (pair && pair.isActive) {
      setSelectedPairId(pairId);
    }
  };

  // Get pair by ID
  const getPairById = (pairId: string) => {
    return pairs.find(pair => pair.id === pairId);
  };

  // Get pairs by token symbol
  const getPairsByToken = (tokenSymbol: string) => {
    return pairs.filter(pair => 
      pair.tokenA.symbol === tokenSymbol || pair.tokenB.symbol === tokenSymbol
    );
  };

  // Get trading direction for a pair
  const getTradingDirection = (pairId: string, fromToken: string) => {
    const pair = getPairById(pairId);
    if (!pair) return null;
    
    if (pair.tokenA.symbol === fromToken) {
      return 'AtoB';
    } else if (pair.tokenB.symbol === fromToken) {
      return 'BtoA';
    }
    return null;
  };

  // Get the other token in a pair
  const getOtherToken = (pairId: string, currentToken: string) => {
    const pair = getPairById(pairId);
    if (!pair) return null;
    
    if (pair.tokenA.symbol === currentToken) {
      return pair.tokenB;
    } else if (pair.tokenB.symbol === currentToken) {
      return pair.tokenA;
    }
    return null;
  };

  // Format pair display name
  const formatPairName = (pair: TradingPair) => {
    return `${pair.tokenA.symbol}/${pair.tokenB.symbol}`;
  };

  // Get pair price (simplified - in real app would be more complex)
  const getPairPrice = (pairId: string) => {
    const pair = getPairById(pairId);
    if (!pair) return 0;
    
    // For now, return mock price based on pair
    const basePrices: { [key: string]: number } = {
      'flow-usdc': 0.85,
      'flow-usdt': 0.84,
      'usdc-usdt': 1.0,
      'flow-btc': 0.000025,
    };
    
    return basePrices[pairId] || 0;
  };

  return {
    pairs,
    selectedPair,
    selectedPairId,
    activePairs,
    popularPairs,
    trendingPairs,
    switchPair,
    getPairById,
    getPairsByToken,
    getTradingDirection,
    getOtherToken,
    formatPairName,
    getPairPrice,
  };
};
