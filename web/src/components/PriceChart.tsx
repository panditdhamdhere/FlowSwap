import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { usePriceHistory } from '../hooks/usePriceHistory';

interface PriceChartProps {
  direction: 'AtoB' | 'BtoA';
  className?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ direction, className = '' }) => {
  const {
    candlestickData,
    technicalIndicators,
    priceChange,
    high24h,
    low24h,
    timeframe,
    setTimeframe,
    currentPrice
  } = usePriceHistory(direction);

  const [showIndicators, setShowIndicators] = useState({
    sma20: false,
    ema12: false,
    ema26: false,
    rsi: false
  });

  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');

  const timeframes = [
    { key: '1m', label: '1m' },
    { key: '5m', label: '5m' },
    { key: '15m', label: '15m' },
    { key: '1h', label: '1h' },
    { key: '4h', label: '4h' },
    { key: '1d', label: '1d' }
  ] as const;

  // Prepare data for chart
  const chartData = candlestickData.map((candle, index) => ({
    ...candle,
    sma20: technicalIndicators.sma20[index] || null,
    ema12: technicalIndicators.ema12[index] || null,
    ema26: technicalIndicators.ema26[index] || null,
    rsi: technicalIndicators.rsi[index] || null,
    // For line chart, use close price
    price: candle.close,
    // For volume bars
    volume: candle.volume
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(data.timestamp).toLocaleString()}
          </p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Price: {data.close?.toFixed(6) || data.price?.toFixed(6)} {direction === 'AtoB' ? 'USDC' : 'FLOW'}
          </p>
          {data.volume > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Volume: {data.volume.toFixed(2)}
            </p>
          )}
          {showIndicators.sma20 && data.sma20 && (
            <p className="text-xs text-blue-500">SMA20: {data.sma20.toFixed(6)}</p>
          )}
          {showIndicators.ema12 && data.ema12 && (
            <p className="text-xs text-green-500">EMA12: {data.ema12.toFixed(6)}</p>
          )}
          {showIndicators.ema26 && data.ema26 && (
            <p className="text-xs text-purple-500">EMA26: {data.ema26.toFixed(6)}</p>
          )}
          {showIndicators.rsi && data.rsi && (
            <p className="text-xs text-orange-500">RSI: {data.rsi.toFixed(2)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No price data available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Connect wallet and add liquidity to see charts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Chart Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {direction === 'AtoB' ? 'FLOW/USDC' : 'USDC/FLOW'} Price Chart
            </h3>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {currentPrice.toFixed(6)} {direction === 'AtoB' ? 'USDC' : 'FLOW'}
              </span>
              <span className={`text-sm ${priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                24h: {low24h.toFixed(6)} - {high24h.toFixed(6)}
              </span>
            </div>
          </div>
          
          {/* Chart Controls */}
          <div className="flex items-center space-x-2">
            {/* Chart Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  chartType === 'line'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  chartType === 'candlestick'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Candles
              </button>
            </div>

            {/* Timeframe Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    timeframe === tf.key
                      ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Indicators Toggle */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Indicators:</span>
          {[
            { key: 'sma20', label: 'SMA20', color: 'blue' },
            { key: 'ema12', label: 'EMA12', color: 'green' },
            { key: 'ema26', label: 'EMA26', color: 'purple' },
            { key: 'rsi', label: 'RSI', color: 'orange' }
          ].map((indicator) => (
            <label key={indicator.key} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={showIndicators[indicator.key as keyof typeof showIndicators]}
                onChange={(e) => setShowIndicators(prev => ({
                  ...prev,
                  [indicator.key]: e.target.checked
                }))}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{indicator.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 0.001', 'dataMax + 0.001']}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Volume bars */}
              <Bar 
                dataKey="volume" 
                fill="#3B82F6" 
                opacity={0.3}
                yAxisId="volume"
              />
              
              {/* Main price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
              
              {/* Technical indicators */}
              {showIndicators.sma20 && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#2563EB"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="5 5"
                />
              )}
              {showIndicators.ema12 && (
                <Line
                  type="monotone"
                  dataKey="ema12"
                  stroke="#10B981"
                  strokeWidth={1}
                  dot={false}
                />
              )}
              {showIndicators.ema26 && (
                <Line
                  type="monotone"
                  dataKey="ema26"
                  stroke="#8B5CF6"
                  strokeWidth={1}
                  dot={false}
                />
              )}
              
              {/* RSI reference lines */}
              {showIndicators.rsi && (
                <>
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
