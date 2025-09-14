import * as fcl from '@onflow/fcl'

const FLOW_DEX_ADDRESS = "0xf8d6e0586b0a20c7"
const TEST_TOKEN_ADDRESS = "0xf8d6e0586b0a20c7"
const TEST_TOKEN2_ADDRESS = "0xf8d6e0586b0a20c7"

const ADD_LIQUIDITY_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}
import TestToken from ${TEST_TOKEN_ADDRESS}
import TestToken2 from ${TEST_TOKEN2_ADDRESS}
import FungibleToken from 0x9a0766d93b6608b7

transaction(amountA: UFix64, amountB: UFix64, minLiquidity: UFix64) {
    let dex: &FlowDEX
    let tokenAVault: &TestToken.Vault
    let tokenBVault: &TestToken2.Vault
    let liquidityVault: &FlowDEX.LiquidityVault

    prepare(acct: AuthAccount) {
        // Get DEX reference
        self.dex = acct.getAccount(0xf8d6e0586b0a20c7).getContract(name: "FlowDEX") as! &FlowDEX
        
        // Get token vaults
        self.tokenAVault = acct.getCapability(/public/TestTokenReceiver)
            .borrow<&TestToken.Vault{FungibleToken.Receiver}>()
            ?? panic("Could not borrow TestToken receiver")
        
        self.tokenBVault = acct.getCapability(/public/TestToken2Receiver)
            .borrow<&TestToken2.Vault{FungibleToken.Receiver}>()
            ?? panic("Could not borrow TestToken2 receiver")
        
        // Get liquidity vault
        self.liquidityVault = acct.getCapability(/public/FlowDEXLiquidityReceiver)
            .borrow<&FlowDEX.LiquidityVault{FungibleToken.Receiver}>()
            ?? panic("Could not borrow FlowDEX liquidity receiver")
    }

    execute {
        // Transfer tokens to DEX
        let tempVaultA <- self.tokenAVault.withdraw(amount: amountA)
        let tempVaultB <- self.tokenBVault.withdraw(amount: amountB)
        
        // Add liquidity
        let liquidity = self.dex.addLiquidity(
            amountA: amountA, 
            amountB: amountB, 
            minLiquidity: minLiquidity
        )
        
        // Mint liquidity tokens to user
        let minter = self.dex.createMinter()
        minter.mint(amount: liquidity, recipient: self.liquidityVault)
        
        log("Added liquidity: ", liquidity)
    }
}
`

const REMOVE_LIQUIDITY_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}
import TestToken from ${TEST_TOKEN_ADDRESS}
import TestToken2 from ${TEST_TOKEN2_ADDRESS}
import FungibleToken from 0x9a0766d93b6608b7

transaction(liquidity: UFix64, minAmountA: UFix64, minAmountB: UFix64) {
    let dex: &FlowDEX
    let tokenAVault: &TestToken.Vault
    let tokenBVault: &TestToken2.Vault
    let liquidityVault: &FlowDEX.LiquidityVault

    prepare(acct: AuthAccount) {
        self.dex = acct.getAccount(0xf8d6e0586b0a20c7).getContract(name: "FlowDEX") as! &FlowDEX
        
        self.tokenAVault = acct.getCapability(/public/TestTokenReceiver)
            .borrow<&TestToken.Vault{FungibleToken.Receiver}>()
            ?? panic("Could not borrow TestToken receiver")
        
        self.tokenBVault = acct.getCapability(/public/TestToken2Receiver)
            .borrow<&TestToken2.Vault{FungibleToken.Receiver}>()
            ?? panic("Could not borrow TestToken2 receiver")
        
        self.liquidityVault = acct.getCapability(/private/FlowDEXLiquidityBalance)
            .borrow<&FlowDEX.LiquidityVault{FungibleToken.Balance}>()
            ?? panic("Could not borrow FlowDEX liquidity balance")
    }

    execute {
        // Withdraw liquidity tokens
        let liquidityTokens <- self.liquidityVault.withdraw(amount: liquidity)
        
        // Remove liquidity
        let (amountA, amountB) = self.dex.removeLiquidity(
            liquidity: liquidity,
            minAmountA: minAmountA,
            minAmountB: minAmountB
        )
        
        // Deposit tokens back to user vaults
        self.tokenAVault.deposit(from: <-create TestToken.Vault(balance: amountA))
        self.tokenBVault.deposit(from: <-create TestToken2.Vault(balance: amountB))
        
        // Burn liquidity tokens
        let minter = self.dex.createMinter()
        minter.burn(amount: liquidity)
        
        destroy liquidityTokens
        
        log("Removed liquidity: A=", amountA, " B=", amountB)
    }
}
`

const SWAP_A_FOR_B_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}
import TestToken from ${TEST_TOKEN_ADDRESS}
import TestToken2 from ${TEST_TOKEN2_ADDRESS}
import FungibleToken from 0x9a0766d93b6608b7

transaction(amountIn: UFix64, minAmountOut: UFix64) {
    let dex: &FlowDEX
    let tokenAVault: &TestToken.Vault
    let tokenBVault: &TestToken2.Vault

    prepare(acct: AuthAccount) {
        self.dex = acct.getAccount(0xf8d6e0586b0a20c7).getContract(name: "FlowDEX") as! &FlowDEX
        
        self.tokenAVault = acct.getCapability(/private/TestTokenBalance)
            .borrow<&TestToken.Vault{FungibleToken.Balance}>()
            ?? panic("Could not borrow TestToken balance")
        
        self.tokenBVault = acct.getCapability(/public/TestToken2Receiver)
            .borrow<&TestToken2.Vault{FungibleToken.Receiver}>()
            ?? panic("Could not borrow TestToken2 receiver")
    }

    execute {
        // Withdraw input tokens
        let inputVault <- self.tokenAVault.withdraw(amount: amountIn)
        
        // Perform swap
        let amountOut = self.dex.swapAForB(amountIn: amountIn, minAmountOut: minAmountOut)
        
        // Deposit output tokens
        self.tokenBVault.deposit(from: <-create TestToken2.Vault(balance: amountOut))
        
        log("Swapped: ", amountIn, " A for ", amountOut, " B")
    }
}
`

const SWAP_B_FOR_A_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}
import TestToken from ${TEST_TOKEN_ADDRESS}
import TestToken2 from ${TEST_TOKEN2_ADDRESS}
import FungibleToken from 0x9a0766d93b6608b7

transaction(amountIn: UFix64, minAmountOut: UFix64) {
    let dex: &FlowDEX
    let tokenAVault: &TestToken.Vault
    let tokenBVault: &TestToken2.Vault

    prepare(acct: AuthAccount) {
        self.dex = acct.getAccount(0xf8d6e0586b0a20c7).getContract(name: "FlowDEX") as! &FlowDEX
        
        self.tokenAVault = acct.getCapability(/public/TestTokenReceiver)
            .borrow<&TestToken.Vault{FungibleToken.Receiver}>()
            ?? panic("Could not borrow TestToken receiver")
        
        self.tokenBVault = acct.getCapability(/private/TestToken2Balance)
            .borrow<&TestToken2.Vault{FungibleToken.Balance}>()
            ?? panic("Could not borrow TestToken2 balance")
    }

    execute {
        // Withdraw input tokens
        let inputVault <- self.tokenBVault.withdraw(amount: amountIn)
        
        // Perform swap
        let amountOut = self.dex.swapBForA(amountIn: amountIn, minAmountOut: minAmountOut)
        
        // Deposit output tokens
        self.tokenAVault.deposit(from: <-create TestToken.Vault(balance: amountOut))
        
        log("Swapped: ", amountIn, " B for ", amountOut, " A")
    }
}
`

const GET_RESERVES_SCRIPT = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(): (UFix64, UFix64, UFix64) {
    let dex = FlowDEX()
    return (dex.getReserveA(), dex.getReserveB(), dex.getTotalSupply())
}
`

const GET_PRICE_SCRIPT = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(): (UFix64, UFix64) {
    let dex = FlowDEX()
    return (dex.getPriceA(), dex.getPriceB())
}
`

const GET_QUOTE_SCRIPT = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(amountIn: UFix64, swapDirection: String): UFix64 {
    let dex = FlowDEX()
    if swapDirection == "AtoB" {
        let amountInWithFee = amountIn * 9970.0 / 10000.0
        return dex.getReserveB() * amountInWithFee / (dex.getReserveA() + amountInWithFee)
    } else {
        let amountInWithFee = amountIn * 9970.0 / 10000.0
        return dex.getReserveA() * amountInWithFee / (dex.getReserveB() + amountInWithFee)
    }
}
`

export async function addLiquidity(amountA: number, amountB: number, minLiquidity: number = 0) {
  return fcl.mutate({
    cadence: ADD_LIQUIDITY_TX,
    args: (arg, t) => [
      arg(amountA.toFixed(1), t.UFix64),
      arg(amountB.toFixed(1), t.UFix64),
      arg(minLiquidity.toFixed(1), t.UFix64)
    ]
  })
}

export async function removeLiquidity(liquidity: number, minAmountA: number = 0, minAmountB: number = 0) {
  return fcl.mutate({
    cadence: REMOVE_LIQUIDITY_TX,
    args: (arg, t) => [
      arg(liquidity.toFixed(1), t.UFix64),
      arg(minAmountA.toFixed(1), t.UFix64),
      arg(minAmountB.toFixed(1), t.UFix64)
    ]
  })
}

export async function swapAForB(amountIn: number, minAmountOut: number = 0) {
  return fcl.mutate({
    cadence: SWAP_A_FOR_B_TX,
    args: (arg, t) => [
      arg(amountIn.toFixed(1), t.UFix64),
      arg(minAmountOut.toFixed(1), t.UFix64)
    ]
  })
}

export async function swapBForA(amountIn: number, minAmountOut: number = 0) {
  return fcl.mutate({
    cadence: SWAP_B_FOR_A_TX,
    args: (arg, t) => [
      arg(amountIn.toFixed(1), t.UFix64),
      arg(minAmountOut.toFixed(1), t.UFix64)
    ]
  })
}

export async function getReserves() {
  return fcl.query({
    cadence: GET_RESERVES_SCRIPT
  })
}

export async function getPrices() {
  return fcl.query({
    cadence: GET_PRICE_SCRIPT
  })
}

export async function getQuote(amountIn: number, swapDirection: 'AtoB' | 'BtoA') {
  return fcl.query({
    cadence: GET_QUOTE_SCRIPT,
    args: (arg, t) => [
      arg(amountIn.toFixed(1), t.UFix64),
      arg(swapDirection, t.String)
    ]
  })
}