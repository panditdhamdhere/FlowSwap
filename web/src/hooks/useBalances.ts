import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { ensureBalanceCaps, getDemoFlowBalance, getDemoUSDCBalance } from '../transactions'

// On-chain balances via Demo tokens

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
      await ensureBalanceCaps().catch(() => {})
      let flowNum = 0
      let usdcNum = 0
      for (let i = 0; i < 5; i++) {
        const [flowBal, usdcBal] = await Promise.all([
          getDemoFlowBalance(userAddress) as Promise<string>,
          getDemoUSDCBalance(userAddress) as Promise<string>,
        ])
        flowNum = parseFloat(flowBal || '0') || 0
        usdcNum = parseFloat(usdcBal || '0') || 0
        if (flowNum > 0 || usdcNum > 0) break
        await new Promise((r) => setTimeout(r, 800))
      }
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

  const addBalance = async () => { await fetchBalances() }

  useEffect(() => {
    fetchBalances()
  }, [userAddress])

  return { balances, loading, error, refetch: fetchBalances, addBalance }
}
