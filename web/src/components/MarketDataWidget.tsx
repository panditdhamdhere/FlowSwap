import React from 'react'
import { motion } from 'framer-motion'
import { useMarketData } from '../hooks/useMarketData'

interface MarketDataWidgetProps {
  className?: string
  compact?: boolean
}

export default function MarketDataWidget({ className = '', compact = false }: MarketDataWidgetProps) {
  const { 
    marketData, 
    loading, 
    error, 
    lastUpdated, 
    getFlowData, 
    getUSDCData, 
    formatPrice, 
    formatPercentageChange, 
    formatLargeNumber,
    refresh 
  } = useMarketData()

  const flowData = getFlowData()
  const usdcData = getUSDCData()

  if (loading && marketData.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error && marketData.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-red-500 dark:text-red-400 text-sm">
          Failed to load market data
          <button 
            onClick={refresh}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        {flowData && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                ${formatPrice(flowData.current_price)}
              </div>
              <div className={`text-xs ${
                flowData.price_change_percentage_24h >= 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {formatPercentageChange(flowData.price_change_percentage_24h)}
              </div>
            </div>
          </div>
        )}
        
        {usdcData && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">U</span>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                ${formatPrice(usdcData.current_price, 2)}
              </div>
              <div className={`text-xs ${
                usdcData.price_change_percentage_24h >= 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {formatPercentageChange(usdcData.price_change_percentage_24h)}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div 
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Market Data
        </h3>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh market data"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {flowData && (
          <motion.div 
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {flowData.name} ({flowData.symbol.toUpperCase()})
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Market Cap: {formatLargeNumber(flowData.market_cap)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                ${formatPrice(flowData.current_price)}
              </div>
              <div className={`text-sm font-medium ${
                flowData.price_change_percentage_24h >= 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {formatPercentageChange(flowData.price_change_percentage_24h)} (24h)
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Vol: {formatLargeNumber(flowData.total_volume)}
              </div>
            </div>
          </motion.div>
        )}

        {usdcData && (
          <motion.div 
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">U</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {usdcData.name} ({usdcData.symbol.toUpperCase()})
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Market Cap: {formatLargeNumber(usdcData.market_cap)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                ${formatPrice(usdcData.current_price, 2)}
              </div>
              <div className={`text-sm font-medium ${
                usdcData.price_change_percentage_24h >= 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {formatPercentageChange(usdcData.price_change_percentage_24h)} (24h)
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Vol: {formatLargeNumber(usdcData.total_volume)}
              </div>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Updating market data...</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
