import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import { useAppStore } from '../store'

const GET_BALANCE_SCRIPT = `
import FungibleToken from 0xFungibleToken

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
  const userAddress = useAppStore((s) => s.userAddress)

  const fetchBalances = async () => {
    if (!userAddress) {
      setBalances({ test1: '0', test2: '0' })
      return
    }

    setLoading(true)
    try {
      const [test1Balance, test2Balance] = await Promise.all([
        fcl.query({
          cadence: GET_BALANCE_SCRIPT,
          args: (arg, t) => [
            arg(userAddress, t.Address),
            arg('/storage/TestTokenVault', t.StoragePath)
          ]
        }),
        fcl.query({
          cadence: GET_BALANCE_SCRIPT,
          args: (arg, t) => [
            arg(userAddress, t.Address),
            arg('/storage/TestToken2Vault', t.StoragePath)
          ]
        })
      ])
      
      setBalances({
        test1: test1Balance?.toString() || '0',
        test2: test2Balance?.toString() || '0'
      })
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalances()
  }, [userAddress])

  return { balances, loading, refetch: fetchBalances }
}
