import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolio } from '../hooks/usePortfolio';
import { useTradingPairs } from '../hooks/useTradingPairs';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PortfolioProps {
  className?: string;
}

const Portfolio: React.FC<PortfolioProps> = ({ className = '' }) => {
  const {
    positions,
    stats,
    getRecentTrades,
    getTradeHistory,
    clearTrades,
    exportPortfolio,
  } = usePortfolio();

  const { pairs } = useTradingPairs();
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'history' | 'analytics'>('overview');

  const recentTrades = getRecentTrades(5);
  const tradeHistory = getTradeHistory();

  // Prepare data for charts
  const portfolioChartData = tradeHistory.map((trade) => ({
    time: new Date(trade.timestamp).toLocaleDateString(),
    value: trade.value,
    pnl: Math.random() * 100 - 50, // Mock P&L data
    fees: trade.fees,
  })).slice(-30); // Last 30 trades

  const positionChartData = positions.map(pos => ({
    name: pairs.find(p => p.id === pos.pairId)?.name || 'Unknown',
    value: pos.totalValue,
    pnl: pos.totalPnL,
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Portfolio Dashboard</h3>
          <div className="flex space-x-2">
            <button
              onClick={exportPortfolio}
              className="px-3 py-1 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Export
            </button>
            <button
              onClick={clearTrades}
              className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Clear Data
            </button>
          </div>
        </div>
        
        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {formatCurrency(stats.totalValue)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total P&L</div>
            <div className={`text-lg font-semibold ${getPnLColor(stats.totalPnL)}`}>
              {formatCurrency(stats.totalPnL)}
            </div>
            <div className={`text-xs ${getPnLColor(stats.totalPnLPercentage)}`}>
              {formatPercentage(stats.totalPnLPercentage)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Trades</div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {stats.totalTrades}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {stats.winRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-4">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'positions', label: 'Positions' },
            { key: 'history', label: 'History' },
            { key: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Portfolio Value Chart */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Portfolio Value Over Time
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={portfolioChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                    <XAxis dataKey="time" tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} name="Value" />
                    <Bar dataKey="fees" fill="#82ca9d" opacity={0.3} name="Fees" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Trades */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Recent Trades
                </h4>
                {recentTrades.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No trades yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {trade.type.toUpperCase()} {pairs.find(p => p.id === trade.pairId)?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(trade.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {formatCurrency(trade.amount * trade.price)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {trade.amount.toFixed(4)} @ {trade.price.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'positions' && (
            <motion.div
              key="positions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Positions List */}
              <div className="space-y-4">
                {positions.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No open positions
                  </div>
                ) : (
                  positions.map((position) => {
                    const pair = pairs.find(p => p.id === position.pairId);
                    return (
                      <div key={position.pairId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                              {pair?.name || 'Unknown Pair'}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {position.tokenA.amount.toFixed(4)} {position.tokenA.symbol} + {position.tokenB.amount.toFixed(4)} {position.tokenB.symbol}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              {formatCurrency(position.totalValue)}
                            </div>
                            <div className={`text-sm ${getPnLColor(position.totalPnL)}`}>
                              {formatCurrency(position.totalPnL)} ({formatPercentage(position.pnlPercentage)})
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Avg Price</div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {position.tokenA.avgPrice.toFixed(4)} {position.tokenA.symbol}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Realized P&L</div>
                            <div className={`font-medium ${getPnLColor(position.realizedPnL)}`}>
                              {formatCurrency(position.realizedPnL)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Position Distribution Chart */}
              {positions.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Position Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={positionChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {positionChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Trade History
                </h4>
                {tradeHistory.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No trade history
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {tradeHistory.map((trade) => (
                      <div key={trade.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {trade.type.toUpperCase()} {trade.pairName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(trade.timestamp).toLocaleString()}
                            </div>
                            {trade.txHash && (
                              <div className="text-xs text-blue-500 dark:text-blue-400">
                                {trade.txHash.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {formatCurrency(trade.value)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {trade.amount.toFixed(4)} @ {trade.price.toFixed(4)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Fee: {formatCurrency(trade.fees)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Fees Paid</div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {formatCurrency(stats.totalFees)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Trade Size</div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {formatCurrency(stats.avgTradeSize)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Best Trade</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.bestTrade)}
                  </div>
                </div>
              </div>

              {/* P&L Chart */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  P&L Over Time
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={portfolioChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                    <XAxis dataKey="time" tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="pnl" stroke="#82ca9d" dot={false} name="P&L" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Portfolio;
