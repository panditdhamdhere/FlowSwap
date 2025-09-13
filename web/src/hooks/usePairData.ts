import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'

const FLOW_DEX_ADDRESS = "0xf8d6e0586b0a20c7"

const GET_RESERVES_SCRIPT = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(): (UFix64, UFix64) {
    let dex = FlowDEX()
    return (dex.getReserveA(), dex.getReserveB())
}
`

export function usePairData() {
  const [reserves, setReserves] = useState<{reserveA: number, reserveB: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReserves = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await fcl.query({
        cadence: GET_RESERVES_SCRIPT
      })
      
      setReserves({
        reserveA: parseFloat(result[0]),
        reserveB: parseFloat(result[1])
      })
    } catch (err) {
      console.error('Error fetching reserves:', err)
      setError('Failed to fetch reserves')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReserves()
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchReserves, 10000)
    return () => clearInterval(interval)
  }, [])

  return {
    reserves,
    loading,
    error,
    refetch: fetchReserves
  }
}