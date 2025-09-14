import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as fcl from '@onflow/fcl'
import { usePairData } from '../hooks/usePairData'
import { useBalances } from '../hooks/useBalances'
import { useAppStore } from '../store'

// Mock FCL
vi.mock('@onflow/fcl', () => ({
  query: vi.fn()
}))

// Mock the store
vi.mock('../store', () => ({
  useAppStore: vi.fn()
}))

// Mock transactions
vi.mock('../transactions', () => ({
  getReserves: vi.fn(),
  getPrices: vi.fn(),
  getQuote: vi.fn()
}))

describe('Custom Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('usePairData', () => {
    it('should fetch and return pair data', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockResolvedValue([1000, 2000, 100, 2.0, 0.5])

      const { result } = renderHook(() => usePairData())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.pairData).toEqual({
        reserveA: 1000,
        reserveB: 2000,
        totalSupply: 100,
        priceA: 2.0,
        priceB: 0.5,
        liquidity: 5000, // 1000 + (2000 * 2.0)
        volume24h: 0,
        fee24h: 0
      })
    })

    it('should handle errors gracefully', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => usePairData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch pair data')
    })

    it('should calculate price impact correctly', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockResolvedValue([1000, 2000, 100, 2.0, 0.5])

      const { result } = renderHook(() => usePairData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const priceImpact = result.current.calculatePriceImpact(100, 'AtoB')
      expect(typeof priceImpact).toBe('number')
      expect(priceImpact).toBeGreaterThanOrEqual(0)
    })

    it('should calculate slippage correctly', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockResolvedValue([1000, 2000, 100, 2.0, 0.5])

      const { result } = renderHook(() => usePairData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const slippage = result.current.calculateSlippage(100, 200, 'AtoB')
      expect(typeof slippage).toBe('number')
      expect(slippage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('useBalances', () => {
    it('should fetch and return user balances', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockResolvedValueOnce('1000') // test1 balance
      mockQuery.mockResolvedValueOnce('500')  // test2 balance

      ;(useAppStore as any).mockReturnValue({
        userAddress: '0x123'
      })

      const { result } = renderHook(() => useBalances())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.balances).toEqual({
        test1: '1000',
        test2: '500'
      })
    })

    it('should return zero balances when no user address', async () => {
      ;(useAppStore as any).mockReturnValue({
        userAddress: null
      })

      const { result } = renderHook(() => useBalances())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.balances).toEqual({
        test1: '0',
        test2: '0'
      })
    })

    it('should handle errors gracefully', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockRejectedValue(new Error('Network error'))

      ;(useAppStore as any).mockReturnValue({
        userAddress: '0x123'
      })

      const { result } = renderHook(() => useBalances())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.balances).toEqual({
        test1: '0',
        test2: '0'
      })
    })
  })
})
