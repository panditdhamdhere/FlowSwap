import * as fcl from '@onflow/fcl'

// const FUNGIBLE_TOKEN_ADDRESS = "0xee82856bf20e2aa6"
const FLOW_DEX_ADDRESS = "0xf8d6e0586b0a20c7"

const ADD_LIQUIDITY_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

transaction(amountA: UFix64, amountB: UFix64) {
    prepare(acct: AuthAccount) {
        // For now, we'll just call the contract function directly
        // In a real implementation, you'd need to handle token transfers
        let dex = FlowDEX()
        let liquidity = dex.addLiquidity(amountA: amountA, amountB: amountB)
        log("Added liquidity: ", liquidity)
    }
}
`

const SWAP_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

transaction(amountIn: UFix64) {
    prepare(acct: AuthAccount) {
        // For now, we'll just call the contract function directly
        // In a real implementation, you'd need to handle token transfers
        let dex = FlowDEX()
        let amountOut = dex.swapAForB(amountIn: amountIn)
        log("Swapped: ", amountIn, " for ", amountOut)
    }
}
`

const GET_RESERVES_TX = `
import FlowDEX from ${FLOW_DEX_ADDRESS}

access(all) fun main(): (UFix64, UFix64) {
    let dex = FlowDEX()
    return (dex.getReserveA(), dex.getReserveB())
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

export async function swap(amountIn: number) {
  return fcl.mutate({
    cadence: SWAP_TX,
    args: (arg, t) => [
      arg(amountIn.toFixed(1), t.UFix64)
    ]
  })
}

export async function getReserves() {
  return fcl.query({
    cadence: GET_RESERVES_TX
  })
}