import FungibleToken from 0x9a0766d93b6608b7

access(all) contract FlowDEX {

    access(all) event LiquidityAdded(amountA: UFix64, amountB: UFix64)

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

    init() {
        self.reserveA = 0.0
        self.reserveB = 0.0
    }
}