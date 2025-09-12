import * as fcl from '@onflow/fcl'

const MINT_TOKENS_TX = `
import FungibleToken from 0xFungibleToken
import TestToken from 0xTestToken
import TestToken2 from 0xTestToken2

transaction(amount1: UFix64, amount2: UFix64) {
    prepare(acct: AuthAccount) {
        let r1 = acct.getCapability(/public/TestTokenReceiver).borrow<&{FungibleToken.Receiver}>() ?? panic("missing receiver 1")
        let r2 = acct.getCapability(/public/TestToken2Receiver).borrow<&{FungibleToken.Receiver}>() ?? panic("missing receiver 2")
        let m1 = TestToken.createMinter()
        let m2 = TestToken2.createMinter()
        m1.mint(amount: amount1, recipient: r1)
        m2.mint(amount: amount2, recipient: r2)
    }
}
`

const ADD_LIQUIDITY_TX = `
import FungibleToken from 0xFungibleToken
import DexRouter from 0xDexRouter
import TestToken from 0xTestToken
import TestToken2 from 0xTestToken2

transaction(id: String, amountA: UFix64, amountB: UFix64) {
    prepare(acct: AuthAccount) {
        let vaultARef = acct.borrow<&TestToken.Vault>(from: /storage/TestTokenVault) ?? panic("missing vault A")
        let vaultBRef = acct.borrow<&TestToken2.Vault>(from: /storage/TestToken2Vault) ?? panic("missing vault B")
        let outA <- vaultARef.withdraw(amount: amountA)
        let outB <- vaultBRef.withdraw(amount: amountB)
        
        let router = DexRouter()
        router.addLiquidity(id: id, fromA: <-outA, fromB: <-outB, lpReceiver: acct.getCapability(/public/TestTokenReceiver).borrow<&{FungibleToken.Receiver}>() ?? panic("missing LP receiver"))
    }
}
`

const SWAP_TX = `
import FungibleToken from 0xFungibleToken
import DexRouter from 0xDexRouter
import TestToken from 0xTestToken
import TestToken2 from 0xTestToken2

transaction(id: String, amountIn: UFix64, minOut: UFix64, direction: String) {
    prepare(acct: AuthAccount) {
        let router = DexRouter()
        
        if direction == "AtoB" {
            let vaultARef = acct.borrow<&TestToken.Vault>(from: /storage/TestTokenVault) ?? panic("missing vault A")
            let outA <- vaultARef.withdraw(amount: amountIn)
            router.swapExactAForB(id: id, amountIn: amountIn, minOut: minOut, fromA: <-outA, toB: acct.getCapability(/public/TestToken2Receiver).borrow<&{FungibleToken.Receiver}>() ?? panic("missing receiver B"))
        } else {
            let vaultBRef = acct.borrow<&TestToken2.Vault>(from: /storage/TestToken2Vault) ?? panic("missing vault B")
            let outB <- vaultBRef.withdraw(amount: amountIn)
            router.swapExactBForA(id: id, amountIn: amountIn, minOut: minOut, fromB: <-outB, toA: acct.getCapability(/public/TestTokenReceiver).borrow<&{FungibleToken.Receiver}>() ?? panic("missing receiver A"))
        }
    }
}
`

export async function mintTokens(amount1: number, amount2: number) {
  return fcl.mutate({
    cadence: MINT_TOKENS_TX,
    args: (arg, t) => [
      arg(amount1.toFixed(1), t.UFix64),
      arg(amount2.toFixed(1), t.UFix64)
    ]
  })
}

export async function addLiquidity(pairId: string, amountA: number, amountB: number) {
  return fcl.mutate({
    cadence: ADD_LIQUIDITY_TX,
    args: (arg, t) => [
      arg(pairId, t.String),
      arg(amountA.toFixed(1), t.UFix64),
      arg(amountB.toFixed(1), t.UFix64)
    ]
  })
}

export async function swap(pairId: string, amountIn: number, minOut: number, direction: 'AtoB' | 'BtoA') {
  return fcl.mutate({
    cadence: SWAP_TX,
    args: (arg, t) => [
      arg(pairId, t.String),
      arg(amountIn.toFixed(1), t.UFix64),
      arg(minOut.toFixed(1), t.UFix64),
      arg(direction, t.String)
    ]
  })
}
