import { useState, useEffect } from 'react'
import { useAppStore } from '../store'

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
      // For now, show mock balances for demonstration
      // In a real implementation, you would query the actual token contracts
      setBalances({
        flow: '1,250.50',
        usdc: '5,000.00'
      })
    } catch (error) {
      console.error('Error fetching balances:', error)
      setError('Failed to fetch balances')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalances()
  }, [userAddress])

  return { balances, loading, error, refetch: fetchBalances }
}
