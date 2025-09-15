import FungibleToken from 0xee82856bf20e2aa6

access(all) contract FlowDEX {

    access(all) event LiquidityAdded(amountA: UFix64, amountB: UFix64)
    access(all) event Swap(direction: String, amountIn: UFix64, amountOut: UFix64)

    access(all) var reserveA: UFix64
    access(all) var reserveB: UFix64

    access(all) fun addLiquidity(amountA: UFix64, amountB: UFix64): UFix64 {
        self.reserveA = self.reserveA + amountA
        self.reserveB = self.reserveB + amountB
        
        emit LiquidityAdded(amountA: amountA, amountB: amountB)
        return amountA
    }

    access(all) fun getReserveA(): UFix64 {
        return self.reserveA
    }

    access(all) fun getReserveB(): UFix64 {
        return self.reserveB
    }

    // Constant product quote with 0.3% fee (x*y=k)
    access(all) fun getQuoteAtoB(amountIn: UFix64): UFix64 {
        if self.reserveA == 0.0 || self.reserveB == 0.0 || amountIn == 0.0 {
            return 0.0
        }
        let feeMultiplier: UFix64 = 0.997
        let amountInWithFee: UFix64 = amountIn * feeMultiplier
        let numerator: UFix64 = amountInWithFee * self.reserveB
        let denominator: UFix64 = self.reserveA + amountInWithFee
        return numerator / denominator
    }

    access(all) fun getQuoteBtoA(amountIn: UFix64): UFix64 {
        if self.reserveA == 0.0 || self.reserveB == 0.0 || amountIn == 0.0 {
            return 0.0
        }
        let feeMultiplier: UFix64 = 0.997
        let amountInWithFee: UFix64 = amountIn * feeMultiplier
        let numerator: UFix64 = amountInWithFee * self.reserveA
        let denominator: UFix64 = self.reserveB + amountInWithFee
        return numerator / denominator
    }

    // Executes a swap from A to B adjusting reserves; for demo only (no token transfers)
    access(all) fun swapAForB(amountIn: UFix64, minAmountOut: UFix64): UFix64 {
        let amountOut: UFix64 = self.getQuoteAtoB(amountIn: amountIn)
        pre {
            amountOut >= minAmountOut: "INSUFFICIENT_OUTPUT_AMOUNT"
            amountOut <= self.reserveB: "INSUFFICIENT_LIQUIDITY"
        }
        self.reserveA = self.reserveA + amountIn
        self.reserveB = self.reserveB - amountOut
        emit Swap(direction: "AtoB", amountIn: amountIn, amountOut: amountOut)
        return amountOut
    }

    // Executes a swap from B to A adjusting reserves; for demo only (no token transfers)
    access(all) fun swapBForA(amountIn: UFix64, minAmountOut: UFix64): UFix64 {
        let amountOut: UFix64 = self.getQuoteBtoA(amountIn: amountIn)
        pre {
            amountOut >= minAmountOut: "INSUFFICIENT_OUTPUT_AMOUNT"
            amountOut <= self.reserveA: "INSUFFICIENT_LIQUIDITY"
        }
        self.reserveB = self.reserveB + amountIn
        self.reserveA = self.reserveA - amountOut
        emit Swap(direction: "BtoA", amountIn: amountIn, amountOut: amountOut)
        return amountOut
    }

    init() {
        self.reserveA = 0.0
        self.reserveB = 0.0
    }
}