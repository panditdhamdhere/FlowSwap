import * as fcl from '@onflow/fcl'

// Testnet contract addresses (deployed contracts)
const FLOW_DEX_ADDRESS = "0x18f0d1d9cfa52c6d"
// Token contracts on testnet (our demo tokens acting as FLOW/USDC)
const TESTTOKEN_ADDRESS = "0x18f0d1d9cfa52c6d"   // TestToken (FLOW demo)
const TESTTOKEN2_ADDRESS = "0x0ea4b4ea56a1260c"  // TestToken2 (USDC demo)
const FUNGIBLE_TOKEN_ADDRESS = "0x9a0766d93b6608b7"

const ADD_LIQUIDITY_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

transaction(amountA: UFix64, amountB: UFix64) {
    prepare(acct: &Account) {
        log("Adding liquidity with amounts: A=".concat(amountA.toString()).concat(" B=").concat(amountB.toString()))
    }

    execute {
        // Add liquidity to the DEX
        let liquidity = FlowDEX.addLiquidity(amountA: amountA, amountB: amountB)
        log("Added liquidity: ".concat(liquidity.toString()))
    }
}
`

const SWAP_A_TO_B_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

transaction(amountIn: UFix64, minAmountOut: UFix64) {
    execute {
    let out = FlowDEX.swapAForB(amountIn: amountIn, minAmountOut: minAmountOut)
    log(out)
  }
}
`

const SWAP_B_TO_A_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

transaction(amountIn: UFix64, minAmountOut: UFix64) {
    execute {
    let out = FlowDEX.swapBForA(amountIn: amountIn, minAmountOut: minAmountOut)
    log(out)
    }
}
`

const GET_RESERVES_SCRIPT = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(): [UFix64] {
    return [FlowDEX.getReserveA(), FlowDEX.getReserveB()]
}
`

export async function addLiquidity(amountA: number, amountB: number) {
  const txId = await fcl.mutate({
    cadence: ADD_LIQUIDITY_TX,
    args: (arg, t) => [
      arg(amountA.toFixed(1), t.UFix64),
      arg(amountB.toFixed(1), t.UFix64)
    ],
    limit: 9999
  })
  await fcl.tx(txId).onceSealed()
  return txId
}

export async function getReserves() {
  return fcl.query({
    cadence: GET_RESERVES_SCRIPT
  })
}

// ===== Balances: public Balance cap scripts =====
const GET_TESTTOKEN_BAL = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import TestToken from ${TESTTOKEN_ADDRESS}

access(all) fun main(addr: Address): UFix64 {
  let cap = getAccount(addr)
    .getCapability<&{FungibleToken.Balance}>(/public/TestTokenBalance)
  if !cap.check() { return 0.0 }
  let ref = cap.borrow() ?? panic("Missing TestTokenBalance capability")
  return ref.balance
}
`

const GET_TESTTOKEN2_BAL = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import TestToken2 from ${TESTTOKEN2_ADDRESS}

access(all) fun main(addr: Address): UFix64 {
  let cap = getAccount(addr)
    .getCapability<&{FungibleToken.Balance}>(/public/TestToken2Balance)
  if !cap.check() { return 0.0 }
  let ref = cap.borrow() ?? panic("Missing TestToken2Balance capability")
  return ref.balance
}
`

export async function getTestTokenBalance(address: string) {
  return fcl.query({
    cadence: GET_TESTTOKEN_BAL,
    args: (arg, t) => [arg(address, t.Address)]
  })
}

export async function getTestToken2Balance(address: string) {
  return fcl.query({
    cadence: GET_TESTTOKEN2_BAL,
    args: (arg, t) => [arg(address, t.Address)]
  })
}

// Transaction to ensure public Balance capabilities are linked for the signer
const ENSURE_BALANCE_CAPS_TX = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import TestToken from ${TESTTOKEN_ADDRESS}
import TestToken2 from ${TESTTOKEN2_ADDRESS}

transaction() {
  prepare(acct: auth(Storage, Capabilities) &Account) {
    // TestToken balance cap
    let hasCap1 = acct.getCapability<&{FungibleToken.Balance}>(/public/TestTokenBalance).check()
    if (!hasCap1) {
      acct.link<&{FungibleToken.Balance}>(/public/TestTokenBalance, target: /storage/TestTokenVault)
    }
    // TestToken2 balance cap
    let hasCap2 = acct.getCapability<&{FungibleToken.Balance}>(/public/TestToken2Balance).check()
    if (!hasCap2) {
      acct.link<&{FungibleToken.Balance}>(/public/TestToken2Balance, target: /storage/TestToken2Vault)
    }
  }
}
`

export async function ensureBalanceCaps() {
  return fcl.mutate({ cadence: ENSURE_BALANCE_CAPS_TX })
}

// Setup transaction to create user's vaults if missing and link receiver/balance
const SETUP_VAULTS_TX = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import TestToken from ${TESTTOKEN_ADDRESS}
import TestToken2 from ${TESTTOKEN2_ADDRESS}

transaction() {
  prepare(acct: auth(Storage, Capabilities) &Account) {
    // TestToken vault
    if acct.borrow<&TestToken.Vault>(from: /storage/TestTokenVault) == nil {
      acct.save(<-TestToken.createEmptyVault(), to: /storage/TestTokenVault)
    }
    if !acct.getCapability<&{FungibleToken.Receiver}>(/public/TestTokenReceiver).check() {
      acct.link<&{FungibleToken.Receiver}>(/public/TestTokenReceiver, target: /storage/TestTokenVault)
    }
    if !acct.getCapability<&{FungibleToken.Balance}>(/public/TestTokenBalance).check() {
      acct.link<&{FungibleToken.Balance}>(/public/TestTokenBalance, target: /storage/TestTokenVault)
    }

    // TestToken2 vault
    if acct.borrow<&TestToken2.Vault>(from: /storage/TestToken2Vault) == nil {
      acct.save(<-TestToken2.createEmptyVault(), to: /storage/TestToken2Vault)
    }
    if !acct.getCapability<&{FungibleToken.Receiver}>(/public/TestToken2Receiver).check() {
      acct.link<&{FungibleToken.Receiver}>(/public/TestToken2Receiver, target: /storage/TestToken2Vault)
    }
    if !acct.getCapability<&{FungibleToken.Balance}>(/public/TestToken2Balance).check() {
      acct.link<&{FungibleToken.Balance}>(/public/TestToken2Balance, target: /storage/TestToken2Vault)
    }
  }
}
`

export async function setupDemoTokenVaults() {
  const txId = await fcl.mutate({ cadence: SETUP_VAULTS_TX, limit: 9999 })
  await fcl.tx(txId).onceSealed()
  return txId
}

// ===== Faucet: Mint test tokens =====
const MINT_TESTTOKEN_TX = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import TestToken from ${TESTTOKEN_ADDRESS}

transaction(amount: UFix64) {
  prepare(acct: AuthAccount) {
    // Get the contract account
    let contractAccount = acct.getAccount(${TESTTOKEN_ADDRESS})
    
    // Get the contract's vault
    let contractVault = contractAccount.getCapability<&TestToken.Vault>(/public/TestTokenReceiver)
      .borrow() ?? panic("Could not borrow contract vault")
    
    // Get user's vault
    let userVault = acct.getCapability<&TestToken.Vault>(/public/TestTokenReceiver)
      .borrow() ?? panic("Could not borrow user vault")
    
    // Transfer from contract to user
    userVault.deposit(from: <-contractVault.withdraw(amount: amount))
  }
}
`

const MINT_TESTTOKEN2_TX = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import TestToken2 from ${TESTTOKEN2_ADDRESS}

transaction(amount: UFix64) {
  prepare(acct: AuthAccount) {
    // Get the contract account
    let contractAccount = acct.getAccount(${TESTTOKEN2_ADDRESS})
    
    // Get the contract's vault
    let contractVault = contractAccount.getCapability<&TestToken2.Vault>(/public/TestToken2Receiver)
      .borrow() ?? panic("Could not borrow contract vault")
    
    // Get user's vault
    let userVault = acct.getCapability<&TestToken2.Vault>(/public/TestToken2Receiver)
      .borrow() ?? panic("Could not borrow user vault")
    
    // Transfer from contract to user
    userVault.deposit(from: <-contractVault.withdraw(amount: amount))
  }
}
`

export async function mintTestToken(amount: number = 1000) {
  // Ensure vaults are set up first
  try {
    await setupDemoTokenVaults()
  } catch (error) {
    console.log('Vault setup failed, continuing with mint:', error)
  }
  
  const txId = await fcl.mutate({
    cadence: MINT_TESTTOKEN_TX,
    args: (arg, t) => [arg(amount.toFixed(1), t.UFix64)],
    limit: 9999
  })
  await fcl.tx(txId).onceSealed()
  return txId
}

export async function mintTestToken2(amount: number = 1000) {
  // Ensure vaults are set up first
  try {
    await setupDemoTokenVaults()
  } catch (error) {
    console.log('Vault setup failed, continuing with mint:', error)
  }
  
  const txId = await fcl.mutate({
    cadence: MINT_TESTTOKEN2_TX,
    args: (arg, t) => [arg(amount.toFixed(1), t.UFix64)],
    limit: 9999
  })
  await fcl.tx(txId).onceSealed()
  return txId
}

const REMOVE_LIQ_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

transaction(percent: UFix64) {
  execute {
    let outs = FlowDEX.removeLiquidity(percent: percent)
    log(outs)
  }
}
`

export async function removeLiquidityPercent(percent: number) {
  const txId = await fcl.mutate({
    cadence: REMOVE_LIQ_TX,
    args: (arg, t) => [arg(percent.toFixed(1), t.UFix64)],
    limit: 9999
  })
  await fcl.tx(txId).onceSealed()
  return txId
}

export async function swapAForB(_amountIn: number, _minAmountOut: number = 0) {
  const txId = await fcl.mutate({
    cadence: SWAP_A_TO_B_TX,
    args: (arg, t) => [
      arg(_amountIn.toFixed(1), t.UFix64),
      arg(_minAmountOut.toFixed(1), t.UFix64)
    ],
    limit: 9999
  })
  await fcl.tx(txId).onceSealed()
  return txId
}

export async function swapBForA(_amountIn: number, _minAmountOut: number = 0) {
  const txId = await fcl.mutate({
    cadence: SWAP_B_TO_A_TX,
    args: (arg, t) => [
      arg(_amountIn.toFixed(1), t.UFix64),
      arg(_minAmountOut.toFixed(1), t.UFix64)
    ],
    limit: 9999
  })
  await fcl.tx(txId).onceSealed()
  return txId
}

export async function getPrices() {
  const result = await getReserves()
  const [reserveAStr, reserveBStr] = result as [string, string]
  const reserveA = parseFloat(reserveAStr) || 0
  const reserveB = parseFloat(reserveBStr) || 0

  const priceA = reserveB > 0 ? reserveA / reserveB : 0
  const priceB = reserveA > 0 ? reserveB / reserveA : 0

  return { priceA, priceB, reserveA, reserveB }
}

export async function getQuote(_amountIn: number, _swapDirection: 'AtoB' | 'BtoA') {
  if (_amountIn <= 0) return 0

  const result = await getReserves()
  const [reserveAStr, reserveBStr] = result as [string, string]
  const reserveA = parseFloat(reserveAStr) || 0
  const reserveB = parseFloat(reserveBStr) || 0

  const feeMultiplier = 0.997 // 0.3% fee
  const amountInWithFee = _amountIn * feeMultiplier

  if (_swapDirection === 'AtoB') {
    if (reserveA <= 0 || reserveB <= 0) return 0
    const numerator = amountInWithFee * reserveB
    const denominator = reserveA + amountInWithFee
    return numerator / denominator
  } else {
    if (reserveA <= 0 || reserveB <= 0) return 0
    const numerator = amountInWithFee * reserveA
    const denominator = reserveB + amountInWithFee
    return numerator / denominator
  }
}