import { useState, useEffect } from 'react'
import { useAppStore } from '../store'

// Simulated balances since on-chain reading is having issues with testnet's older Cadence version
const simulatedBalances = new Map<string, { flow: number; usdc: number }>()

export function useBalances() {
  const [balances, setBalances] = useState<{ flow: string; usdc: string }>({ flow: '0', usdc: '0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userAddress = useAppStore((s) => s.userAddress)

  const fetchBalances = async () => {
    if (!userAddress) {
      setBalances({ flow: '0', usdc: '0' })
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Get simulated balances for this user
      const userBalances = simulatedBalances.get(userAddress) || { flow: 0, usdc: 0 }
      
      setBalances({
        flow: userBalances.flow.toLocaleString(undefined, { maximumFractionDigits: 6 }),
        usdc: userBalances.usdc.toLocaleString(undefined, { maximumFractionDigits: 6 })
      })
    } catch (error) {
      console.error('Error fetching balances:', error)
      setError('Failed to fetch balances')
    } finally {
      setLoading(false)
    }
  }

  const addBalance = (token: 'flow' | 'usdc', amount: number) => {
    if (!userAddress) return
    
    const current = simulatedBalances.get(userAddress) || { flow: 0, usdc: 0 }
    current[token] += amount
    simulatedBalances.set(userAddress, current)
    fetchBalances() // Refresh display
  }

  useEffect(() => {
    fetchBalances()
  }, [userAddress])

  return { balances, loading, error, refetch: fetchBalances, addBalance }
}
