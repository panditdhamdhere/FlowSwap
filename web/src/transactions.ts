import * as fcl from '@onflow/fcl'
// Simple retry helper to survive transient testnet Access API failures (HTTP 503, Unavailable)
async function retry<T>(fn: () => Promise<T>, attempts = 4, baseDelayMs = 700): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      // Exponential backoff
      const wait = baseDelayMs * Math.pow(1.7, i)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}

// Testnet contract addresses (deployed contracts)
const FLOW_DEX_ADDRESS = "0x18f0d1d9cfa52c6d"
// Demo tokens with on-chain faucet
const DEMO_FLOW_ADDRESS = "0x18f0d1d9cfa52c6d"   // DemoFLOW deployed on panditd
const DEMO_USDC_ADDRESS = "0x0ea4b4ea56a1260c"   // DemoUSDC deployed on panditd2
const FUNGIBLE_TOKEN_ADDRESS = "0x9a0766d93b6608b7"

const ADD_LIQUIDITY_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import DemoFLOW from ${DEMO_FLOW_ADDRESS}
import DemoUSDC from ${DEMO_USDC_ADDRESS}

transaction(amountA: UFix64, amountB: UFix64) {
    prepare(acct: AuthAccount) {
        // Get vault references
        let flowVault = acct.borrow<&DemoFLOW.Vault>(from: /storage/DemoFLOWVault)
            ?? panic("DemoFLOW vault not found")
        let usdcVault = acct.borrow<&DemoUSDC.Vault>(from: /storage/DemoUSDCVault)
            ?? panic("DemoUSDC vault not found")
        
        // Withdraw tokens from user's vaults
        let flowTokens <- flowVault.withdraw(amount: amountA)
        let usdcTokens <- usdcVault.withdraw(amount: amountB)
        
        // Destroy the withdrawn tokens (simulating transfer to DEX)
        destroy flowTokens
        destroy usdcTokens
        
        log("Transferred tokens to DEX: FLOW=".concat(amountA.toString()).concat(" USDC=").concat(amountB.toString()))
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
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import DemoFLOW from ${DEMO_FLOW_ADDRESS}
import DemoUSDC from ${DEMO_USDC_ADDRESS}

transaction(amountIn: UFix64, minAmountOut: UFix64) {
    prepare(acct: AuthAccount) {
        // Get vault references
        let flowVault = acct.borrow<&DemoFLOW.Vault>(from: /storage/DemoFLOWVault)
            ?? panic("DemoFLOW vault not found")
        let usdcVault = acct.borrow<&DemoUSDC.Vault>(from: /storage/DemoUSDCVault)
            ?? panic("DemoUSDC vault not found")
        
        // Withdraw input tokens (FLOW)
        let flowTokens <- flowVault.withdraw(amount: amountIn)
        destroy flowTokens
        
        log("Swapping FLOW to USDC: amountIn=".concat(amountIn.toString()))
    }

    execute {
        let out = FlowDEX.swapAForB(amountIn: amountIn, minAmountOut: minAmountOut)
        log("Swap result: ".concat(out.toString()))
        
        // Note: In a real DEX, we would deposit the output tokens back to user's vault
        // For this demo, the DEX contract handles the token accounting
    }
}
`

const SWAP_B_TO_A_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import DemoFLOW from ${DEMO_FLOW_ADDRESS}
import DemoUSDC from ${DEMO_USDC_ADDRESS}

transaction(amountIn: UFix64, minAmountOut: UFix64) {
    prepare(acct: AuthAccount) {
        // Get vault references
        let flowVault = acct.borrow<&DemoFLOW.Vault>(from: /storage/DemoFLOWVault)
            ?? panic("DemoFLOW vault not found")
        let usdcVault = acct.borrow<&DemoUSDC.Vault>(from: /storage/DemoUSDCVault)
            ?? panic("DemoUSDC vault not found")
        
        // Withdraw input tokens (USDC)
        let usdcTokens <- usdcVault.withdraw(amount: amountIn)
        destroy usdcTokens
        
        log("Swapping USDC to FLOW: amountIn=".concat(amountIn.toString()))
    }

    execute {
        let out = FlowDEX.swapBForA(amountIn: amountIn, minAmountOut: minAmountOut)
        log("Swap result: ".concat(out.toString()))
        
        // Note: In a real DEX, we would deposit the output tokens back to user's vault
        // For this demo, the DEX contract handles the token accounting
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
  const txId = await retry(() => fcl.mutate({
    cadence: ADD_LIQUIDITY_TX,
    args: (arg, t) => [
      arg(amountA.toFixed(1), t.UFix64),
      arg(amountB.toFixed(1), t.UFix64)
    ],
    limit: 9999
  }))
  await waitForSeal(txId)
  return txId
}

// Seed initial liquidity to the DEX (for testing)
export async function seedLiquidity() {
  // First mint tokens if needed
  await mintTestToken(10000)
  await mintTestToken2(10000)
  
  // Add initial liquidity
  return await addLiquidity(1000, 1000)
}

export async function getReserves() {
  return retry(() => fcl.query({
    cadence: GET_RESERVES_SCRIPT
  }))
}

// ===== Balances: public Balance cap scripts =====
const GET_DEMOFLOW_BALANCE_SCRIPT = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}

access(all) fun main(addr: Address): UFix64 {
  // Cache bust: ${Date.now()}
  let account = getAccount(addr)
  let cap = account.getCapability(/public/DemoFLOWBalance)
  if !cap.check() { 
    return 0.0 
  }
  let ref = cap.borrow<&{FungibleToken.Balance}>() ?? panic("Missing DemoFLOWBalance capability")
  return ref.balance
}
`

const GET_DEMOUSDC_BALANCE_SCRIPT = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}

access(all) fun main(addr: Address): UFix64 {
  // Cache bust: ${Date.now()}
  let account = getAccount(addr)
  let cap = account.getCapability(/public/DemoUSDCBalance)
  if !cap.check() { 
    return 0.0 
  }
  let ref = cap.borrow<&{FungibleToken.Balance}>() ?? panic("Missing DemoUSDCBalance capability")
  return ref.balance
}
`

export async function getDemoFlowBalance(address: string) {
  try {
    console.log('Using script version:', Date.now())
    const result = await retry(() => fcl.query({
      cadence: GET_DEMOFLOW_BALANCE_SCRIPT,
      args: (arg, t) => [arg(address, t.Address)]
    }))
    console.log('DemoFLOW balance query result:', result)
    return result
  } catch (error) {
    console.error('Error fetching DemoFLOW balance:', error)
    return '0'
  }
}

export async function getDemoUSDCBalance(address: string) {
  try {
    console.log('Using USDC script version:', Date.now())
    const result = await retry(() => fcl.query({
      cadence: GET_DEMOUSDC_BALANCE_SCRIPT,
      args: (arg, t) => [arg(address, t.Address)]
    }))
    console.log('DemoUSDC balance query result:', result)
    return result
  } catch (error) {
    console.error('Error fetching DemoUSDC balance:', error)
    return '0'
  }
}

// Transaction to ensure public Balance capabilities are linked for the signer
const ENSURE_BALANCE_CAPS_TX = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import DemoFLOW from ${DEMO_FLOW_ADDRESS}
import DemoUSDC from ${DEMO_USDC_ADDRESS}

transaction() {
  prepare(acct: AuthAccount) {
    // DemoFLOW
    if acct.borrow<&DemoFLOW.Vault>(from: /storage/DemoFLOWVault) == nil {
      acct.save(<-DemoFLOW.createEmptyVault(), to: /storage/DemoFLOWVault)
    }
    if !acct.getCapability<&{FungibleToken.Receiver}>(/public/DemoFLOWReceiver).check() {
      acct.link<&{FungibleToken.Receiver}>(/public/DemoFLOWReceiver, target: /storage/DemoFLOWVault)
    }
    if !acct.getCapability<&{FungibleToken.Balance}>(/public/DemoFLOWBalance).check() {
      acct.link<&{FungibleToken.Balance}>(/public/DemoFLOWBalance, target: /storage/DemoFLOWVault)
    }

    // DemoUSDC
    if acct.borrow<&DemoUSDC.Vault>(from: /storage/DemoUSDCVault) == nil {
      acct.save(<-DemoUSDC.createEmptyVault(), to: /storage/DemoUSDCVault)
    }
    if !acct.getCapability<&{FungibleToken.Receiver}>(/public/DemoUSDCReceiver).check() {
      acct.link<&{FungibleToken.Receiver}>(/public/DemoUSDCReceiver, target: /storage/DemoUSDCVault)
    }
    if !acct.getCapability<&{FungibleToken.Balance}>(/public/DemoUSDCBalance).check() {
      acct.link<&{FungibleToken.Balance}>(/public/DemoUSDCBalance, target: /storage/DemoUSDCVault)
    }
  }
}
`

export async function ensureBalanceCaps() {
  return retry(() => fcl.mutate({ cadence: ENSURE_BALANCE_CAPS_TX }))
}

// Setup transaction to create user's vaults if missing and link receiver/balance
const SETUP_VAULTS_TX = ENSURE_BALANCE_CAPS_TX

export async function setupDemoTokenVaults() {
  console.log('Setting up demo token vaults...')
  const txId = await retry(() => fcl.mutate({ cadence: SETUP_VAULTS_TX, limit: 9999 }))
  console.log('Vault setup transaction ID:', txId)
  await waitForSeal(txId)
  console.log('Vault setup transaction sealed')
  return txId
}

// ===== Faucet: Mint test tokens =====
const FAUCET_MINT_FLOW = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import DemoFLOW from ${DEMO_FLOW_ADDRESS}

transaction(amount: UFix64) {
  prepare(acct: AuthAccount) {
    let cap = acct.getCapability<&{FungibleToken.Receiver}>(/public/DemoFLOWReceiver)
    DemoFLOW.faucetMint(to: cap, amount: amount)
  }
}
`

const FAUCET_MINT_USDC = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import DemoUSDC from ${DEMO_USDC_ADDRESS}

transaction(amount: UFix64) {
  prepare(acct: AuthAccount) {
    let cap = acct.getCapability<&{FungibleToken.Receiver}>(/public/DemoUSDCReceiver)
    DemoUSDC.faucetMint(to: cap, amount: amount)
  }
}
`

export async function mintTestToken(amount: number = 1000) {
  console.log('Setting up DemoFLOW vaults...')
  await setupDemoTokenVaults()
  console.log('Minting DemoFLOW tokens...')
  const txId = await retry(() => fcl.mutate({
    cadence: FAUCET_MINT_FLOW,
    args: (arg, t) => [arg(amount.toFixed(1), t.UFix64)],
    limit: 9999
  }))
  console.log('DemoFLOW mint transaction ID:', txId)
  await waitForSeal(txId)
  console.log('DemoFLOW mint transaction sealed')
  return txId
}

export async function mintTestToken2(amount: number = 1000) {
  console.log('Setting up DemoUSDC vaults...')
  await setupDemoTokenVaults()
  console.log('Minting DemoUSDC tokens...')
  const txId = await retry(() => fcl.mutate({
    cadence: FAUCET_MINT_USDC,
    args: (arg, t) => [arg(amount.toFixed(1), t.UFix64)],
    limit: 9999
  }))
  console.log('DemoUSDC mint transaction ID:', txId)
  await waitForSeal(txId)
  console.log('DemoUSDC mint transaction sealed')
  return txId
}

const REMOVE_LIQ_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import DemoFLOW from ${DEMO_FLOW_ADDRESS}
import DemoUSDC from ${DEMO_USDC_ADDRESS}

transaction(percent: UFix64) {
  prepare(acct: AuthAccount) {
    // Get vault references
    let flowVault = acct.borrow<&DemoFLOW.Vault>(from: /storage/DemoFLOWVault)
        ?? panic("DemoFLOW vault not found")
    let usdcVault = acct.borrow<&DemoUSDC.Vault>(from: /storage/DemoUSDCVault)
        ?? panic("DemoUSDC vault not found")
    
    log("Removing liquidity: percent=".concat(percent.toString()))
  }

  execute {
    let outs = FlowDEX.removeLiquidity(percent: percent)
    log("Removed liquidity: FLOW=".concat(outs[0].toString()).concat(" USDC=").concat(outs[1].toString()))
    
    // Note: In a real DEX, we would mint/deposit the returned tokens back to user's vault
    // For this demo, the DEX contract handles the token accounting
  }
}
`

export async function removeLiquidityPercent(percent: number) {
  const txId = await retry(() => fcl.mutate({
    cadence: REMOVE_LIQ_TX,
    args: (arg, t) => [arg(percent.toFixed(1), t.UFix64)],
    limit: 9999
  }))
  await waitForSeal(txId)
  return txId
}

export async function swapAForB(_amountIn: number, _minAmountOut: number = 0) {
  const txId = await retry(() => fcl.mutate({
    cadence: SWAP_A_TO_B_TX,
    args: (arg, t) => [
      arg(_amountIn.toFixed(1), t.UFix64),
      arg(_minAmountOut.toFixed(1), t.UFix64)
    ],
    limit: 9999
  }))
  await waitForSeal(txId)
  return txId
}

export async function swapBForA(_amountIn: number, _minAmountOut: number = 0) {
  const txId = await retry(() => fcl.mutate({
    cadence: SWAP_B_TO_A_TX,
    args: (arg, t) => [
      arg(_amountIn.toFixed(1), t.UFix64),
      arg(_minAmountOut.toFixed(1), t.UFix64)
    ],
    limit: 9999
  }))
  await waitForSeal(txId)
  return txId
}

// Polling-based sealing to avoid occasional WebSocket issues
async function waitForSeal(txId: string, maxTries: number = 60, intervalMs: number = 1000) {
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await fcl.tx(txId).snapshot()
      // 4 = SEALED, 5 = EXPIRED; treat 4 as success
      if (res?.status === 4) return res
      if (res?.status === 5) throw new Error('Transaction expired')
    } catch (_) {
      // ignore transient errors and keep polling
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Timeout waiting for transaction to seal')
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

// Check if DEX has sufficient liquidity for operations
export async function hasLiquidity(): Promise<boolean> {
  try {
    const result = await getReserves()
    const [reserveAStr, reserveBStr] = result as [string, string]
    const reserveA = parseFloat(reserveAStr) || 0
    const reserveB = parseFloat(reserveBStr) || 0
    
    // Consider DEX has liquidity if both reserves are > 0
    return reserveA > 0 && reserveB > 0
  } catch (error) {
    console.error('Error checking liquidity:', error)
    return false
  }
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