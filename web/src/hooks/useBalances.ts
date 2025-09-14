import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import { useAppStore } from '../store'

const GET_BALANCE_SCRIPT = `
import FungibleToken from 0x9a0766d93b6608b7

pub fun main(address: Address, vaultPath: StoragePath): UFix64 {
    let account = getAccount(address)
    let vault = account.getCapability(vaultPath).borrow<&{FungibleToken.Balance}>()
        ?? panic("Could not borrow Balance reference to the Vault")
    return vault.balance
}
`

export function useBalances() {
  const [balances, setBalances] = useState<{ test1: string; test2: string }>({ test1: '0', test2: '0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userAddress = useAppStore((s) => s.userAddress)

  const fetchBalances = async () => {
    if (!userAddress) {
      setBalances({ test1: '0', test2: '0' })
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // For now, show zero balances since we haven't implemented token contracts yet
      // TODO: Implement TestToken and TestToken2 contracts and balance queries
      setBalances({
        test1: '0.0',
        test2: '0.0'
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
