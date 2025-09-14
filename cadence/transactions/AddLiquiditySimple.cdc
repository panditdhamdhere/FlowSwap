import FlowDEX from 0xf8d6e0586b0a20c7

transaction(amountA: UFix64, amountB: UFix64) {
    prepare(acct: &Account) {
        // This is a simplified transaction that just calls the contract function
        log("Adding liquidity with amounts: A=".concat(amountA.toString()).concat(" B=").concat(amountB.toString()))
    }

    execute {
        // Add liquidity to the DEX
        let liquidity = FlowDEX.addLiquidity(amountA: amountA, amountB: amountB)
        log("Added liquidity: ".concat(liquidity.toString()))
    }
}
