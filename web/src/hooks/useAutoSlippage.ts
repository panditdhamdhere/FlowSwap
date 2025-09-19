import { useState, useEffect, useMemo } from 'react';
import { usePairData } from './usePairData';

interface AutoSlippageConfig {
  enabled: boolean;
  baseSlippage: number; // Base slippage for small trades
  maxSlippage: number; // Maximum allowed slippage
  volatilityMultiplier: number; // How much to increase slippage based on volatility
  sizeMultiplier: number; // How much to increase slippage based on trade size
}

interface PriceHistory {
  timestamp: number;
  price: number;
}

export const useAutoSlippage = (amountIn: number, direction: 'AtoB' | 'BtoA') => {
  const { pairData } = usePairData();
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [config, setConfig] = useState<AutoSlippageConfig>({
    enabled: true,
    baseSlippage: 0.3, // 0.3% base slippage
    maxSlippage: 5.0, // 5% maximum slippage
    volatilityMultiplier: 2.0, // 2x multiplier for high volatility
    sizeMultiplier: 1.5, // 1.5x multiplier for large trades
  });

  // Calculate current price
  const currentPrice = useMemo(() => {
    if (!pairData || pairData.reserveA === 0 || pairData.reserveB === 0) return 0;
    return direction === 'AtoB' ? pairData.priceA : pairData.priceB;
  }, [pairData, direction]);

  // Update price history
  useEffect(() => {
    if (currentPrice > 0) {
      const now = Date.now();
      setPriceHistory(prev => {
        const newHistory = [...prev, { timestamp: now, price: currentPrice }];
        // Keep only last 10 minutes of data
        return newHistory.filter(item => now - item.timestamp < 10 * 60 * 1000);
      });
    }
  }, [currentPrice]);

  // Calculate price volatility (standard deviation of price changes)
  const volatility = useMemo(() => {
    if (priceHistory.length < 2) return 0;
    
    const priceChanges = [];
    for (let i = 1; i < priceHistory.length; i++) {
      const change = Math.abs((priceHistory[i].price - priceHistory[i-1].price) / priceHistory[i-1].price);
      priceChanges.push(change);
    }
    
    if (priceChanges.length === 0) return 0;
    
    const mean = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const variance = priceChanges.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / priceChanges.length;
    return Math.sqrt(variance) * 100; // Convert to percentage
  }, [priceHistory]);

  // Calculate trade size impact (percentage of pool)
  const tradeSizeImpact = useMemo(() => {
    if (!pairData || amountIn === 0) return 0;
    
    const poolSize = direction === 'AtoB' ? pairData.reserveA : pairData.reserveB;
    return (amountIn / poolSize) * 100;
  }, [pairData, amountIn, direction]);

  // Calculate recommended slippage
  const recommendedSlippage = useMemo(() => {
    if (!config.enabled || amountIn === 0) return config.baseSlippage;
    
    let slippage = config.baseSlippage;
    
    // Adjust for volatility
    if (volatility > 1) { // High volatility (>1% price changes)
      slippage += volatility * config.volatilityMultiplier;
    }
    
    // Adjust for trade size
    if (tradeSizeImpact > 1) { // Large trade (>1% of pool)
      slippage += tradeSizeImpact * config.sizeMultiplier;
    }
    
    // Cap at maximum slippage
    return Math.min(slippage, config.maxSlippage);
  }, [config, amountIn, volatility, tradeSizeImpact]);

  // Get slippage recommendation with reasoning
  const getSlippageRecommendation = () => {
    const reasons = [];
    
    if (volatility > 1) {
      reasons.push(`High volatility detected (${volatility.toFixed(2)}%)`);
    }
    
    if (tradeSizeImpact > 1) {
      reasons.push(`Large trade size (${tradeSizeImpact.toFixed(2)}% of pool)`);
    }
    
    if (reasons.length === 0) {
      reasons.push('Normal market conditions');
    }
    
    return {
      recommended: recommendedSlippage,
      reasons,
      volatility,
      tradeSizeImpact,
      isHighRisk: recommendedSlippage > 2.0
    };
  };

  // Update config
  const updateConfig = (newConfig: Partial<AutoSlippageConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return {
    recommendedSlippage,
    getSlippageRecommendation,
    config,
    updateConfig,
    volatility,
    tradeSizeImpact,
    priceHistory: priceHistory.slice(-10) // Return last 10 price points
  };
};
