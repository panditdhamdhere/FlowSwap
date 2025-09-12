import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import { useAppStore } from '../store'

const GET_PAIR_RESERVES_SCRIPT = `
import DexFactory from 0x8c85caf1772e27b7
import DexPair from 0x8c85caf1772e27b7

pub fun main(pairId: String): (UFix64, UFix64) {
    let pairAddress = DexFactory.getPair(id: pairId) ?? panic("Pair not found")
    let pair = getAccount(pairAddress).getCapability<&DexPair.Pair>(PublicPath(identifier: "/public/DexPair_".concat(pairId))!)
        ?? panic("Could not borrow Pair reference")
    return pair.getReserves()
}
`

export function usePairData() {
  const [reserves, setReserves] = useState<{ reserveA: string; reserveB: string }>({ reserveA: '0', reserveB: '0' })
  const [loading, setLoading] = useState(false)
  const pairId = useAppStore((s) => s.pairId)

  const fetchReserves = async () => {
    setLoading(true)
    try {
      const result = await fcl.query({
        cadence: GET_PAIR_RESERVES_SCRIPT,
        args: (arg, t) => [arg(pairId, t.String)]
      })
      
      if (result && Array.isArray(result) && result.length === 2) {
        setReserves({
          reserveA: result[0]?.toString() || '0',
          reserveB: result[1]?.toString() || '0'
        })
      }
    } catch (error) {
      console.error('Error fetching pair reserves:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReserves()
  }, [pairId])

  return { reserves, loading, refetch: fetchReserves }
}
