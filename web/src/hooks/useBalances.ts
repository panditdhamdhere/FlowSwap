import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { setupDemoTokenVaults, ensureBalanceCaps, getTestTokenBalance, getTestToken2Balance } from '../transactions'

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
      // Ensure user has vaults and public Balance capabilities
      await setupDemoTokenVaults().catch(() => {})
      await ensureBalanceCaps().catch(() => {})
      const [flowBal, usdcBal] = await Promise.all([
        getTestTokenBalance(userAddress) as Promise<string>,
        getTestToken2Balance(userAddress) as Promise<string>,
      ])
      const flowNum = parseFloat(flowBal || '0') || 0
      const usdcNum = parseFloat(usdcBal || '0') || 0
      setBalances({
        flow: flowNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
        usdc: usdcNum.toLocaleString(undefined, { maximumFractionDigits: 6 })
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
