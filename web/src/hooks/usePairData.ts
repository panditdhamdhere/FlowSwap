import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import { getQuote } from '../transactions'

const FLOW_DEX_ADDRESS = "0xf8d6e0586b0a20c7"

const GET_PAIR_DATA_SCRIPT = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(): (UFix64, UFix64, UFix64, UFix64, UFix64) {
    let dex = FlowDEX()
    return (
        dex.getReserveA(), 
        dex.getReserveB(), 
        dex.getTotalSupply(),
        dex.getPriceA(),
        dex.getPriceB()
    )
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
      
      const result = await fcl.query({
        cadence: GET_PAIR_DATA_SCRIPT
      })
      
      const [reserveA, reserveB, totalSupply, priceA, priceB] = result
      
      // Calculate liquidity (total value in terms of token A)
      const liquidity = parseFloat(reserveA) + (parseFloat(reserveB) * parseFloat(priceA))
      
      setPairData({
        reserveA: parseFloat(reserveA) || 0,
        reserveB: parseFloat(reserveB) || 0,
        totalSupply: parseFloat(totalSupply) || 0,
        priceA: parseFloat(priceA) || 0,
        priceB: parseFloat(priceB) || 0,
        liquidity: liquidity || 0,
        volume24h: 0, // TODO: Implement volume tracking
        fee24h: 0 // TODO: Implement fee tracking
      })
    } catch (err) {
      console.error('Error fetching pair data:', err)
      setError('Failed to fetch pair data')
    } finally {
      setLoading(false)
    }
  }

  const getSwapQuote = async (amountIn: number, direction: 'AtoB' | 'BtoA') => {
    try {
      const quote = await getQuote(amountIn, direction)
      return parseFloat(quote) || 0
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
    
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchPairData, 5000)
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