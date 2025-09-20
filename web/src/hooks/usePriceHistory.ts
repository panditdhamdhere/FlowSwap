import { useState, useEffect, useMemo } from 'react';
import { usePairData } from './usePairData';

export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string; // Formatted time string
}

export const usePriceHistory = (direction: 'AtoB' | 'BtoA' = 'AtoB') => {
  const { pairData } = usePairData();
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('5m');

  // Get current price
  const currentPrice = useMemo(() => {
    if (!pairData || pairData.reserveA === 0 || pairData.reserveB === 0) return 0;
    return direction === 'AtoB' ? pairData.priceA : pairData.priceB;
  }, [pairData, direction]);

  // Get timeframe in milliseconds
  const timeframeMs = useMemo(() => {
    const timeframes = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return timeframes[timeframe];
  }, [timeframe]);

  // Update price history
  useEffect(() => {
    if (currentPrice > 0) {
      const now = Date.now();
      const newPoint: PriceDataPoint = {
        timestamp: now,
        price: currentPrice,
        volume: 0, // We'll estimate volume based on price changes
        high: currentPrice,
        low: currentPrice,
        open: currentPrice,
        close: currentPrice,
      };

      setPriceHistory(prev => {
        const updated = [...prev, newPoint];
        // Keep only last 24 hours of data
        return updated.filter(point => now - point.timestamp < 24 * 60 * 60 * 1000);
      });
    }
  }, [currentPrice]);

  // Aggregate data into candlesticks based on timeframe
  const candlestickData = useMemo(() => {
    if (priceHistory.length === 0) return [];

    const aggregated: { [key: number]: PriceDataPoint[] } = {};
    
    // Group data points by timeframe intervals
    priceHistory.forEach(point => {
      const intervalStart = Math.floor(point.timestamp / timeframeMs) * timeframeMs;
      if (!aggregated[intervalStart]) {
        aggregated[intervalStart] = [];
      }
      aggregated[intervalStart].push(point);
    });

    // Convert to candlestick format
    const candlesticks: CandlestickData[] = Object.entries(aggregated)
      .map(([timestamp, points]) => {
        const prices = points.map(p => p.price);
        const volumes = points.map(p => p.volume);
        
        return {
          timestamp: parseInt(timestamp),
          open: points[0].price,
          high: Math.max(...prices),
          low: Math.min(...prices),
          close: points[points.length - 1].price,
          volume: volumes.reduce((sum, vol) => sum + vol, 0),
          time: new Date(parseInt(timestamp)).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-100); // Keep last 100 candlesticks

    return candlesticks;
  }, [priceHistory, timeframeMs]);

  // Calculate technical indicators
  const technicalIndicators = useMemo(() => {
    if (candlestickData.length < 20) return { sma20: [], ema12: [], ema26: [], rsi: [] };

    const closes = candlestickData.map(c => c.close);
    
    // Simple Moving Average (20 periods)
    const sma20 = closes.map((_, i) => {
      if (i < 19) return null;
      const sum = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
      return sum / 20;
    });

    // Exponential Moving Averages (12 and 26 periods)
    const ema12: number[] = [];
    const ema26: number[] = [];
    
    closes.forEach((close, i) => {
      if (i === 0) {
        ema12[i] = close;
        ema26[i] = close;
      } else {
        const multiplier12 = 2 / (12 + 1);
        const multiplier26 = 2 / (26 + 1);
        ema12[i] = (close * multiplier12) + (ema12[i - 1] * (1 - multiplier12));
        ema26[i] = (close * multiplier26) + (ema26[i - 1] * (1 - multiplier26));
      }
    });

    // RSI (14 periods)
    const rsi = closes.map((_, i) => {
      if (i < 14) return null;
      
      const gains = [];
      const losses = [];
      
      for (let j = i - 13; j <= i; j++) {
        const change = closes[j] - closes[j - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }
      
      const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
      
      if (avgLoss === 0) return 100;
      
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    });

    return { sma20, ema12, ema26, rsi };
  }, [candlestickData]);

  // Get price change percentage
  const priceChange = useMemo(() => {
    if (candlestickData.length < 2) return 0;
    const first = candlestickData[0].close;
    const last = candlestickData[candlestickData.length - 1].close;
    return ((last - first) / first) * 100;
  }, [candlestickData]);

  // Get 24h high and low
  const high24h = useMemo(() => {
    if (candlestickData.length === 0) return 0;
    return Math.max(...candlestickData.map(c => c.high));
  }, [candlestickData]);

  const low24h = useMemo(() => {
    if (candlestickData.length === 0) return 0;
    return Math.min(...candlestickData.map(c => c.low));
  }, [candlestickData]);

  return {
    candlestickData,
    technicalIndicators,
    priceChange,
    high24h,
    low24h,
    timeframe,
    setTimeframe,
    currentPrice,
    priceHistory: priceHistory.slice(-10) // Return last 10 raw points
  };
};
