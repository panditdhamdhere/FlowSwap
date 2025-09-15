import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fcl from '@onflow/fcl'
import { 
  addLiquidity, 
  removeLiquidity, 
  swapAForB, 
  swapBForA, 
  getReserves, 
  getPrices, 
  getQuote 
} from '../transactions'

// Mock FCL
vi.mock('@onflow/fcl', () => ({
  mutate: vi.fn(),
  query: vi.fn(),
  tx: vi.fn(() => ({
    onceSealed: vi.fn(() => Promise.resolve())
  }))
}))

describe('Transaction Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addLiquidity', () => {
    it('should call fcl.mutate with correct parameters', async () => {
      const mockMutate = vi.mocked(fcl.mutate)
      mockMutate.mockResolvedValue('tx-hash')

      await addLiquidity(100, 200)

      expect(mockMutate).toHaveBeenCalledWith({
        cadence: expect.stringContaining('transaction(amountA: UFix64, amountB: UFix64, minLiquidity: UFix64)'),
        args: expect.any(Function)
      })
    })

    it('should handle default minLiquidity parameter', async () => {
      const mockMutate = vi.mocked(fcl.mutate)
      mockMutate.mockResolvedValue('tx-hash')

      await addLiquidity(100, 200)

      expect(mockMutate).toHaveBeenCalled()
    })
  })

  describe('removeLiquidity', () => {
    it('should call fcl.mutate with correct parameters', async () => {
      const mockMutate = vi.mocked(fcl.mutate)
      mockMutate.mockResolvedValue('tx-hash')

      await removeLiquidity(50, 10, 20)

      expect(mockMutate).toHaveBeenCalledWith({
        cadence: expect.stringContaining('transaction(liquidity: UFix64, minAmountA: UFix64, minAmountB: UFix64)'),
        args: expect.any(Function)
      })
    })

    it('should handle default minAmount parameters', async () => {
      const mockMutate = vi.mocked(fcl.mutate)
      mockMutate.mockResolvedValue('tx-hash')

      await removeLiquidity(50)

      expect(mockMutate).toHaveBeenCalled()
    })
  })

  describe('swapAForB', () => {
    it('should call fcl.mutate with correct parameters', async () => {
      const mockMutate = vi.mocked(fcl.mutate)
      mockMutate.mockResolvedValue('tx-hash')

      await swapAForB(100, 50)

      expect(mockMutate).toHaveBeenCalledWith({
        cadence: expect.stringContaining('transaction(amountIn: UFix64, minAmountOut: UFix64)'),
        args: expect.any(Function)
      })
    })

    it('should handle default minAmountOut parameter', async () => {
      const mockMutate = vi.mocked(fcl.mutate)
      mockMutate.mockResolvedValue('tx-hash')

      await swapAForB(100)

      expect(mockMutate).toHaveBeenCalled()
    })
  })

  describe('swapBForA', () => {
    it('should call fcl.mutate with correct parameters', async () => {
      const mockMutate = vi.mocked(fcl.mutate)
      mockMutate.mockResolvedValue('tx-hash')

      await swapBForA(100, 50)

      expect(mockMutate).toHaveBeenCalledWith({
        cadence: expect.stringContaining('transaction(amountIn: UFix64, minAmountOut: UFix64)'),
        args: expect.any(Function)
      })
    })
  })

  describe('getReserves', () => {
    it('should call fcl.query with correct script', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockResolvedValue([1000, 2000, 100])

      const result = await getReserves()

      expect(mockQuery).toHaveBeenCalledWith({
        cadence: expect.stringContaining('access(all) fun main(): (UFix64, UFix64, UFix64)')
      })
      expect(result).toEqual([1000, 2000, 100])
    })
  })

  describe('getPrices', () => {
    it('should call fcl.query with correct script', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockResolvedValue([2.0, 0.5])

      const result = await getPrices()

      expect(mockQuery).toHaveBeenCalledWith({
        cadence: expect.stringContaining('access(all) fun main(): (UFix64, UFix64)')
      })
      expect(result).toEqual([2.0, 0.5])
    })
  })

  describe('getQuote', () => {
    it('should call fcl.query with correct parameters for AtoB', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockResolvedValue(200)

      const result = await getQuote(100, 'AtoB')

      expect(mockQuery).toHaveBeenCalledWith({
        cadence: expect.stringContaining('access(all) fun main(amountIn: UFix64, swapDirection: String): UFix64'),
        args: expect.any(Function)
      })
      expect(result).toBe(200)
    })

    it('should call fcl.query with correct parameters for BtoA', async () => {
      const mockQuery = vi.mocked(fcl.query)
      mockQuery.mockResolvedValue(50)

      const result = await getQuote(100, 'BtoA')

      expect(mockQuery).toHaveBeenCalledWith({
        cadence: expect.stringContaining('access(all) fun main(amountIn: UFix64, swapDirection: String): UFix64'),
        args: expect.any(Function)
      })
      expect(result).toBe(50)
    })
  })
})
