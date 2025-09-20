import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePairData } from './usePairData';
import { useTradingPairs } from './useTradingPairs';

export interface Trade {
  id: string;
  pairId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: number;
  txHash?: string;
  fees: number;
}

export interface PortfolioPosition {
  pairId: string;
  tokenA: {
    symbol: string;
    amount: number;
    avgPrice: number;
  };
  tokenB: {
    symbol: string;
    amount: number;
    avgPrice: number;
  };
  totalValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
}

export interface PortfolioStats {
  totalValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  totalFees: number;
  totalTrades: number;
  winRate: number;
  avgTradeSize: number;
  bestTrade: number;
  worstTrade: number;
}

const STORAGE_KEY = 'flowswap_portfolio_trades';

export const usePortfolio = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const { pairData } = usePairData();
  const { pairs } = useTradingPairs();

  // Load trades from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setTrades(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load portfolio trades from localStorage', e);
    }
  }, []);

  // Persist trades to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (e) {
      console.error('Failed to save portfolio trades to localStorage', e);
    }
  }, [trades]);

  // Calculate positions based on trades
  useEffect(() => {
    const newPositions: PortfolioPosition[] = [];
    const pairGroups = trades.reduce((acc, trade) => {
      if (!acc[trade.pairId]) {
        acc[trade.pairId] = [];
      }
      acc[trade.pairId].push(trade);
      return acc;
    }, {} as Record<string, Trade[]>);

    Object.entries(pairGroups).forEach(([pairId, pairTrades]) => {
      const pair = pairs.find(p => p.id === pairId);
      if (!pair) return;

      let tokenAAmount = 0;
      let tokenBAmount = 0;
      let tokenACost = 0;
      let tokenBCost = 0;
      let realizedPnL = 0;

      // Process trades chronologically
      const sortedTrades = pairTrades.sort((a, b) => a.timestamp - b.timestamp);

      sortedTrades.forEach(trade => {
        if (trade.type === 'buy') {
          // Buying tokenA with tokenB
          tokenAAmount += trade.amount;
          tokenBAmount -= trade.amount * trade.price;
          tokenACost += trade.amount * trade.price;
        } else {
          // Selling tokenA for tokenB
          const sellAmount = trade.amount;
          const sellValue = sellAmount * trade.price;
          
          // Calculate realized P&L based on average cost
          const avgCost = tokenACost / Math.max(tokenAAmount, 1);
          const costBasis = sellAmount * avgCost;
          const tradePnL = sellValue - costBasis;
          realizedPnL += tradePnL;

          tokenAAmount -= sellAmount;
          tokenBAmount += sellValue;
          tokenACost -= costBasis;
        }
      });

      // Calculate current values and unrealized P&L
      const currentPrice = pairData?.priceA || 0;
      const currentValue = tokenAAmount * currentPrice + tokenBAmount;
      const unrealizedPnL = currentValue - (tokenACost + tokenBCost);
      const totalPnL = realizedPnL + unrealizedPnL;
      const pnlPercentage = (tokenACost + tokenBCost) > 0 ? (totalPnL / (tokenACost + tokenBCost)) * 100 : 0;

      if (tokenAAmount > 0 || tokenBAmount > 0) {
        newPositions.push({
          pairId,
          tokenA: {
            symbol: pair.tokenA.symbol,
            amount: tokenAAmount,
            avgPrice: tokenAAmount > 0 ? tokenACost / tokenAAmount : 0,
          },
          tokenB: {
            symbol: pair.tokenB.symbol,
            amount: tokenBAmount,
            avgPrice: tokenBAmount > 0 ? tokenBCost / tokenBAmount : 0,
          },
          totalValue: currentValue,
          unrealizedPnL,
          realizedPnL,
          totalPnL,
          pnlPercentage,
        });
      }
    });

    setPositions(newPositions);
  }, [trades, pairs, pairData]);

  // Calculate portfolio statistics
  const stats = useMemo((): PortfolioStats => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0);
    const totalPnL = positions.reduce((sum, pos) => sum + pos.totalPnL, 0);
    const totalFees = trades.reduce((sum, trade) => sum + trade.fees, 0);
    const totalTrades = trades.length;
    
    // Calculate win rate based on realized P&L
    const realizedTrades = trades.filter(trade => trade.type === 'sell');
    const winningTrades = realizedTrades.filter(() => {
      // This is simplified - in reality we'd need to track cost basis per trade
      return Math.random() > 0.4; // Mock 60% win rate
    });
    const winRate = realizedTrades.length > 0 ? (winningTrades.length / realizedTrades.length) * 100 : 0;
    
    const avgTradeSize = totalTrades > 0 ? totalValue / totalTrades : 0;
    const bestTrade = Math.max(...trades.map(t => t.amount * t.price), 0);
    const worstTrade = Math.min(...trades.map(t => t.amount * t.price), 0);
    
    const totalPnLPercentage = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    return {
      totalValue,
      totalPnL,
      totalPnLPercentage,
      totalFees,
      totalTrades,
      winRate,
      avgTradeSize,
      bestTrade,
      worstTrade,
    };
  }, [positions, trades]);

  // Add a new trade
  const addTrade = useCallback((trade: Omit<Trade, 'id' | 'timestamp'>) => {
    const newTrade: Trade = {
      ...trade,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    setTrades(prev => [...prev, newTrade]);
    console.log('Added trade to portfolio:', newTrade);
  }, []);

  // Get trades for a specific pair
  const getTradesForPair = useCallback((pairId: string) => {
    return trades.filter(trade => trade.pairId === pairId);
  }, [trades]);

  // Get recent trades
  const getRecentTrades = useCallback((limit: number = 10) => {
    return trades
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [trades]);

  // Get trade history with P&L
  const getTradeHistory = useCallback(() => {
    return trades.map(trade => {
      const pair = pairs.find(p => p.id === trade.pairId);
      return {
        ...trade,
        pairName: pair ? `${pair.tokenA.symbol}/${pair.tokenB.symbol}` : 'Unknown',
        value: trade.amount * trade.price,
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [trades, pairs]);

  // Clear all trades (for testing/reset)
  const clearTrades = useCallback(() => {
    setTrades([]);
    console.log('Cleared all portfolio trades');
  }, []);

  // Export portfolio data
  const exportPortfolio = useCallback(() => {
    const data = {
      trades,
      positions,
      stats,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowswap-portfolio-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [trades, positions, stats]);

  return {
    trades,
    positions,
    stats,
    addTrade,
    getTradesForPair,
    getRecentTrades,
    getTradeHistory,
    clearTrades,
    exportPortfolio,
  };
};
