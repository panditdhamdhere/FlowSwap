import * as fcl from '@onflow/fcl'

// Testnet contract addresses (deployed contracts)
const FLOW_DEX_ADDRESS = "0x18f0d1d9cfa52c6d"
// Note: These addresses are available for future use when implementing token interactions
// const FLOW_TOKEN_ADDRESS = "0x18f0d1d9cfa52c6d"  // TestToken (FLOW)
// const USDC_TOKEN_ADDRESS = "0x0ea4b4ea56a1260c"   // TestToken2 (USDC)
// const FUNGIBLE_TOKEN_ADDRESS = "0x9a0766d93b6608b7"

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

// Note: Our deployed FlowDEX contract is simplified and doesn't have removeLiquidity or swap functions yet
// These will be added in future versions

const GET_RESERVES_SCRIPT = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(): [UFix64] {
    return [FlowDEX.getReserveA(), FlowDEX.getReserveB()]
}
`

export async function addLiquidity(amountA: number, amountB: number) {
  return fcl.mutate({
    cadence: ADD_LIQUIDITY_TX,
    args: (arg, t) => [
      arg(amountA.toFixed(1), t.UFix64),
      arg(amountB.toFixed(1), t.UFix64)
    ]
  })
}

export async function getReserves() {
  return fcl.query({
    cadence: GET_RESERVES_SCRIPT
  })
}

// Note: These functions will be available in future contract versions
export async function removeLiquidity(_liquidity: number, _minAmountA: number = 0, _minAmountB: number = 0) {
  throw new Error("Remove liquidity not yet implemented in deployed contract")
}

export async function swapAForB(_amountIn: number, _minAmountOut: number = 0) {
  throw new Error("Token swaps not yet implemented in deployed contract")
}

export async function swapBForA(_amountIn: number, _minAmountOut: number = 0) {
  throw new Error("Token swaps not yet implemented in deployed contract")
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