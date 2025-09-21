import { useState, useEffect, useCallback } from 'react'

export interface MarketData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  high_24h: number
  low_24h: number
  ath: number
  ath_change_percentage: number
  last_updated: string
}

export interface CoinGeckoResponse {
  [key: string]: {
    usd: number
    usd_24h_change: number
    usd_24h_vol: number
    usd_market_cap: number
  }
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'
const CACHE_DURATION = 30000 // 30 seconds
const RETRY_DELAY = 5000 // 5 seconds
const MAX_RETRIES = 3

interface CacheEntry {
  data: MarketData[] | CoinGeckoResponse
  timestamp: number
}

class MarketDataCache {
  private cache = new Map<string, CacheEntry>()

  get(key: string): MarketData[] | CoinGeckoResponse | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  set(key: string, data: MarketData[] | CoinGeckoResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

const marketDataCache = new MarketDataCache()

export function useMarketData() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch data from CoinGecko with retry logic
  const fetchWithRetry = useCallback(async (url: string, retries = MAX_RETRIES): Promise<any> => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      if (retries > 0) {
        console.warn(`Market data fetch failed, retrying in ${RETRY_DELAY}ms... (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return fetchWithRetry(url, retries - 1)
      }
      throw error
    }
  }, [])

  // Fetch market data for specific coins
  const fetchMarketData = useCallback(async (coinIds: string[] = ['flow', 'usd-coin']) => {
    const cacheKey = `market-${coinIds.join(',')}`
    const cached = marketDataCache.get(cacheKey)
    
    if (cached && Array.isArray(cached)) {
      setMarketData(cached as MarketData[])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`
      const data = await fetchWithRetry(url)
      
      if (Array.isArray(data)) {
        setMarketData(data)
        marketDataCache.set(cacheKey, data)
        setLastUpdated(new Date())
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data'
      setError(errorMessage)
      console.error('Market data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchWithRetry])

  // Fetch price data for specific coins
  const fetchPriceData = useCallback(async (coinIds: string[]): Promise<CoinGeckoResponse | null> => {
    const cacheKey = `prices-${coinIds.join(',')}`
    const cached = marketDataCache.get(cacheKey)
    
    if (cached) {
      return cached as CoinGeckoResponse
    }

    try {
      const url = `${COINGECKO_API_BASE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      const data = await fetchWithRetry(url)
      
      marketDataCache.set(cacheKey, data)
      return data
    } catch (err) {
      console.error('Price data fetch error:', err)
      return null
    }
  }, [fetchWithRetry])

  // Get specific coin data
  const getCoinData = useCallback((symbol: string): MarketData | undefined => {
    return marketData.find(coin => 
      coin.symbol.toLowerCase() === symbol.toLowerCase() ||
      coin.id.toLowerCase() === symbol.toLowerCase()
    )
  }, [marketData])

  // Get Flow and USDC data specifically
  const getFlowData = useCallback((): MarketData | undefined => {
    return getCoinData('flow') || getCoinData('FLOW')
  }, [getCoinData])

  const getUSDCData = useCallback((): MarketData | undefined => {
    return getCoinData('usdc') || getCoinData('usd-coin')
  }, [getCoinData])

  // Format price with appropriate decimals
  const formatPrice = useCallback((price: number, _decimals: number = 4): string => {
    if (price < 0.01) {
      return price.toFixed(6)
    } else if (price < 1) {
      return price.toFixed(4)
    } else if (price < 100) {
      return price.toFixed(3)
    } else {
      return price.toFixed(2)
    }
  }, [])

  // Format percentage change
  const formatPercentageChange = useCallback((change: number): string => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }, [])

  // Format large numbers (market cap, volume)
  const formatLargeNumber = useCallback((num: number): string => {
    if (num >= 1e12) {
      return `$${(num / 1e12).toFixed(2)}T`
    } else if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`
    } else {
      return `$${num.toFixed(2)}`
    }
  }, [])

  // Auto-refresh market data
  useEffect(() => {
    fetchMarketData()
    
    const interval = setInterval(() => {
      fetchMarketData()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [fetchMarketData])

  return {
    marketData,
    loading,
    error,
    lastUpdated,
    fetchMarketData,
    fetchPriceData,
    getCoinData,
    getFlowData,
    getUSDCData,
    formatPrice,
    formatPercentageChange,
    formatLargeNumber,
    refresh: () => {
      marketDataCache.clear()
      fetchMarketData()
    }
  }
}
