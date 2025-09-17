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
      console.log('Fetching balances for address:', userAddress)
      
      // Ensure vaults are set up
      await ensureBalanceCaps().catch((err) => {
        console.warn('Failed to ensure balance caps:', err)
      })
      
      let flowNum = 0
      let usdcNum = 0
      
      for (let i = 0; i < 8; i++) {
        try {
          console.log(`Balance fetch attempt ${i + 1}/8`)
          const [flowBal, usdcBal] = await Promise.all([
            getDemoFlowBalance(userAddress) as Promise<string>,
            getDemoUSDCBalance(userAddress) as Promise<string>,
          ])
          
          console.log('Raw balance responses:', { flowBal, usdcBal })
          
          flowNum = parseFloat(flowBal || '0') || 0
          usdcNum = parseFloat(usdcBal || '0') || 0
          
          console.log('Parsed balances:', { flowNum, usdcNum })
          
          if (flowNum > 0 || usdcNum > 0) {
            console.log('Found non-zero balances, breaking loop')
            break
          }
          
          if (i < 7) {
            console.log('No balances found, waiting 1 second...')
            await new Promise((r) => setTimeout(r, 1000))
          }
        } catch (err) {
          console.error(`Balance fetch attempt ${i + 1} failed:`, err)
          if (i < 7) {
            await new Promise((r) => setTimeout(r, 1000))
          }
        }
      }
      
      console.log('Final balances:', { flowNum, usdcNum })
      
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
