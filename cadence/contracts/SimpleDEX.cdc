import FungibleToken from 0xee82856bf20e2aa6

access(all) contract SimpleDEX {

    access(all) event LiquidityAdded(amountA: UFix64, amountB: UFix64)
    access(all) event SwapExecuted(amountIn: UFix64, amountOut: UFix64)

    access(all) var reserveA: UFix64
    access(all) var reserveB: UFix64
    access(all) var totalSupply: UFix64

    access(all) fun addLiquidity(amountA: UFix64, amountB: UFix64): UFix64 {
        pre { amountA > 0.0 && amountB > 0.0: "Amounts must be positive" }
        
        let liquidity: UFix64
        if self.totalSupply == 0.0 {
            liquidity = amountA
        } else {
            let liquidityA = amountA * self.totalSupply / self.reserveA
            let liquidityB = amountB * self.totalSupply / self.reserveB
            liquidity = min(liquidityA, liquidityB)
        }
        
        self.reserveA = self.reserveA + amountA
        self.reserveB = self.reserveB + amountB
        self.totalSupply = self.totalSupply + liquidity
        
        emit LiquidityAdded(amountA: amountA, amountB: amountB)
        return liquidity
    }

    access(all) fun swapAForB(amountIn: UFix64): UFix64 {
        pre { amountIn > 0.0: "Amount must be positive" }
        pre { self.reserveA > 0.0 && self.reserveB > 0.0: "Insufficient reserves" }
        
        let amountOut = amountIn * self.reserveB / (self.reserveA + amountIn)
        pre { amountOut > 0.0: "Insufficient output" }
        
        self.reserveA = self.reserveA + amountIn
        self.reserveB = self.reserveB - amountOut
        
        emit SwapExecuted(amountIn: amountIn, amountOut: amountOut)
        return amountOut
    }

    access(all) fun getReserves(): (UFix64, UFix64) {
        return (self.reserveA, self.reserveB)
    }

    init() {
        self.reserveA = 0.0
        self.reserveB = 0.0
        self.totalSupply = 0.0
    }
}