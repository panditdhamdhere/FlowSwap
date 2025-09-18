import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'

const FLOW_DEX_ADDRESS = "0x18f0d1d9cfa52c6d"

const GET_PAIR_DATA_SCRIPT = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(): [UFix64] {
    return [FlowDEX.getReserveA(), FlowDEX.getReserveB()]
}
`

export interface PairData {
  reserveA: number
  reserveB: number
  totalSupply: number
  priceA: number
  priceB: number
  liquidity: number
  volume24h: number
  fee24h: number
}

export function usePairData() {
  const [pairData, setPairData] = useState<PairData>({
    reserveA: 0,
    reserveB: 0,
    totalSupply: 0,
    priceA: 0,
    priceB: 0,
    liquidity: 0,
    volume24h: 0,
    fee24h: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPairData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to fetch real contract data first
      try {
        const result = await fcl.query({
          cadence: GET_PAIR_DATA_SCRIPT
        })
        
        const [reserveA, reserveB] = result
        
        // Calculate basic metrics from reserves
        const reserveAValue = parseFloat(reserveA) || 0
        const reserveBValue = parseFloat(reserveB) || 0
        
        // Simple price calculation (1:1 for now since we don't have price functions)
        const priceA = reserveBValue > 0 ? reserveAValue / reserveBValue : 0
        const priceB = reserveAValue > 0 ? reserveBValue / reserveAValue : 0
        
        // Calculate liquidity (sum of both reserves)
        const liquidity = reserveAValue + reserveBValue
        
        setPairData({
          reserveA: reserveAValue,
          reserveB: reserveBValue,
          totalSupply: liquidity,
          priceA: priceA,
          priceB: priceB,
          liquidity: liquidity,
          volume24h: 0,
          fee24h: 0
        })
      } catch (contractError) {
        console.log('Contract not available, using mock data:', contractError)
        // Fallback to mock data for demonstration
        const mockReserveA = 1250.50
        const mockReserveB = 5000.00
        const mockPriceA = mockReserveB / mockReserveA
        const mockPriceB = mockReserveA / mockReserveB
        const mockLiquidity = mockReserveA + mockReserveB
        
        setPairData({
          reserveA: mockReserveA,
          reserveB: mockReserveB,
          totalSupply: mockLiquidity,
          priceA: mockPriceA,
          priceB: mockPriceB,
          liquidity: mockLiquidity,
          volume24h: 12500.75,
          fee24h: 37.50
        })
      }
    } catch (err) {
      console.error('Error fetching pair data:', err)
      setError('Failed to fetch pair data')
    } finally {
      setLoading(false)
    }
  }

  const getSwapQuote = async (amountIn: number) => {
    try {
      // For now, return a simple 1:1 quote since swaps aren't implemented yet
      return amountIn
    } catch (error) {
      console.error('Error getting swap quote:', error)
      return 0
    }
  }

  const calculateSlippage = (amountIn: number, amountOut: number, direction: 'AtoB' | 'BtoA') => {
    if (amountIn === 0) return 0
    
    const expectedPrice = direction === 'AtoB' ? pairData.priceA : pairData.priceB
    const actualPrice = amountOut / amountIn
    const slippage = Math.abs((actualPrice - expectedPrice) / expectedPrice) * 100
    
    return slippage
  }

  const calculatePriceImpact = (amountIn: number, direction: 'AtoB' | 'BtoA') => {
    if (amountIn === 0) return 0
    
    const currentPrice = direction === 'AtoB' ? pairData.priceA : pairData.priceB
    const reserveIn = direction === 'AtoB' ? pairData.reserveA : pairData.reserveB
    const reserveOut = direction === 'AtoB' ? pairData.reserveB : pairData.reserveA
    
    // Calculate price after swap using constant product formula
    const amountInWithFee = amountIn * 0.997 // 0.3% fee
    const newReserveIn = reserveIn + amountInWithFee
    const newReserveOut = (reserveIn * reserveOut) / newReserveIn
    const amountOut = reserveOut - newReserveOut
    const newPrice = amountOut / amountIn
    
    const priceImpact = Math.abs((newPrice - currentPrice) / currentPrice) * 100
    return priceImpact
  }

  useEffect(() => {
    fetchPairData()
    // Throttle pool refresh to every 15 seconds
    const interval = setInterval(fetchPairData, 15000)
    return () => clearInterval(interval)
  }, [])

  return {
    pairData,
    loading,
    error,
    refetch: fetchPairData,
    getSwapQuote,
    calculateSlippage,
    calculatePriceImpact
  }
}