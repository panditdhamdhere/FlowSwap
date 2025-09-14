import FungibleToken from 0x9a0766d93b6608b7
import TestToken from 0xf8d6e0586b0a20c7
import TestToken2 from 0xf8d6e0586b0a20c7

access(all) contract FlowDEX {

    // Events
    access(all) event LiquidityAdded(amountA: UFix64, amountB: UFix64, liquidityTokens: UFix64, provider: Address)
    access(all) event LiquidityRemoved(amountA: UFix64, amountB: UFix64, liquidityTokens: UFix64, provider: Address)
    access(all) event SwapExecuted(amountIn: UFix64, amountOut: UFix64, tokenIn: String, tokenOut: String, trader: Address)

    // Constants
    access(all) let FEE_DENOMINATOR: UFix64
    access(all) let SWAP_FEE: UFix64
    access(all) let MINIMUM_LIQUIDITY: UFix64

    // State variables
    access(all) var reserveA: UFix64
    access(all) var reserveB: UFix64
    access(all) var totalSupply: UFix64

    // Liquidity token vault
    access(all) resource LiquidityVault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
        access(all) var balance: UFix64

        init(balance: UFix64) {
            self.balance = balance
        }

        access(all) fun withdraw(amount: UFix64): @FungibleToken.Vault {
            pre {
                amount > 0.0: "Amount must be positive"
                self.balance >= amount: "Insufficient balance"
            }
            self.balance = self.balance - amount
            return <-create LiquidityVault(balance: amount)
        }

        access(all) fun deposit(from: @FungibleToken.Vault) {
            let vault <- from as! @FlowDEX.LiquidityVault
            self.balance = self.balance + vault.balance
            destroy vault
        }

        access(all) fun getBalance(): UFix64 { 
            return self.balance 
        }
    }

    // Minter resource for liquidity tokens
    access(all) resource Minter {
        access(all) fun mint(amount: UFix64, recipient: &{FungibleToken.Receiver}) {
            pre {
                amount > 0.0: "Amount must be positive"
            }
            FlowDEX.totalSupply = FlowDEX.totalSupply + amount
            recipient.deposit(from: <-create LiquidityVault(balance: amount))
        }

        access(all) fun burn(amount: UFix64) {
            pre {
                amount > 0.0: "Amount must be positive"
                FlowDEX.totalSupply >= amount: "Insufficient total supply"
            }
            FlowDEX.totalSupply = FlowDEX.totalSupply - amount
        }
    }

    // Core AMM functions
    access(all) fun addLiquidity(amountA: UFix64, amountB: UFix64, minLiquidity: UFix64): UFix64 {
        pre {
            amountA > 0.0: "Amount A must be positive"
            amountB > 0.0: "Amount B must be positive"
        }

        let liquidity: UFix64
        if self.totalSupply == 0.0 {
            // First liquidity provision
            liquidity = sqrt(amountA * amountB) - self.MINIMUM_LIQUIDITY
            pre {
                liquidity > 0.0: "Insufficient liquidity minted"
            }
            self.totalSupply = self.MINIMUM_LIQUIDITY
        } else {
            // Subsequent liquidity provision
            let liquidityA = amountA * self.totalSupply / self.reserveA
            let liquidityB = amountB * self.totalSupply / self.reserveB
            liquidity = min(liquidityA, liquidityB)
        }

        pre {
            liquidity >= minLiquidity: "Insufficient liquidity minted"
        }

        // Update reserves
        self.reserveA = self.reserveA + amountA
        self.reserveB = self.reserveB + amountB

        // Mint liquidity tokens
        self.totalSupply = self.totalSupply + liquidity

        emit LiquidityAdded(amountA: amountA, amountB: amountB, liquidityTokens: liquidity, provider: self.account.address)
        
        return liquidity
    }

    access(all) fun removeLiquidity(liquidity: UFix64, minAmountA: UFix64, minAmountB: UFix64): (UFix64, UFix64) {
        pre {
            liquidity > 0.0: "Liquidity must be positive"
            liquidity <= self.totalSupply: "Insufficient liquidity"
        }

        let amountA = liquidity * self.reserveA / self.totalSupply
        let amountB = liquidity * self.reserveB / self.totalSupply

        pre {
            amountA >= minAmountA: "Insufficient amount A"
            amountB >= minAmountB: "Insufficient amount B"
        }

        // Update reserves
        self.reserveA = self.reserveA - amountA
        self.reserveB = self.reserveB - amountB

        // Burn liquidity tokens
        self.totalSupply = self.totalSupply - liquidity

        emit LiquidityRemoved(amountA: amountA, amountB: amountB, liquidityTokens: liquidity, provider: self.account.address)

        return (amountA, amountB)
    }

    access(all) fun swapAForB(amountIn: UFix64, minAmountOut: UFix64): UFix64 {
        pre {
            amountIn > 0.0: "Amount in must be positive"
            self.reserveA > 0.0: "Insufficient reserve A"
            self.reserveB > 0.0: "Insufficient reserve B"
        }

        let amountInWithFee = amountIn * (10000.0 - self.SWAP_FEE) / 10000.0
        let amountOut = self.reserveB * amountInWithFee / (self.reserveA + amountInWithFee)

        pre {
            amountOut >= minAmountOut: "Insufficient output amount"
        }

        // Update reserves
        self.reserveA = self.reserveA + amountIn
        self.reserveB = self.reserveB - amountOut

        emit SwapExecuted(amountIn: amountIn, amountOut: amountOut, tokenIn: "A", tokenOut: "B", trader: self.account.address)

        return amountOut
    }

    access(all) fun swapBForA(amountIn: UFix64, minAmountOut: UFix64): UFix64 {
        pre {
            amountIn > 0.0: "Amount in must be positive"
            self.reserveA > 0.0: "Insufficient reserve A"
            self.reserveB > 0.0: "Insufficient reserve B"
        }

        let amountInWithFee = amountIn * (10000.0 - self.SWAP_FEE) / 10000.0
        let amountOut = self.reserveA * amountInWithFee / (self.reserveB + amountInWithFee)

        pre {
            amountOut >= minAmountOut: "Insufficient output amount"
        }

        // Update reserves
        self.reserveB = self.reserveB + amountIn
        self.reserveA = self.reserveA - amountOut

        emit SwapExecuted(amountIn: amountIn, amountOut: amountOut, tokenIn: "B", tokenOut: "A", trader: self.account.address)

        return amountOut
    }

    // View functions
    access(all) fun getReserveA(): UFix64 {
        return self.reserveA
    }

    access(all) fun getReserveB(): UFix64 {
        return self.reserveB
    }

    access(all) fun getTotalSupply(): UFix64 {
        return self.totalSupply
    }

    access(all) fun getPriceA(): UFix64 {
        if self.reserveA == 0.0 {
            return 0.0
        }
        return self.reserveB / self.reserveA
    }

    access(all) fun getPriceB(): UFix64 {
        if self.reserveB == 0.0 {
            return 0.0
        }
        return self.reserveA / self.reserveB
    }

    // Utility functions
    access(all) fun createEmptyVault(): @FungibleToken.Vault { 
        return <-create LiquidityVault(balance: 0.0) 
    }

    access(all) fun createMinter(): &Minter { 
        return &self.minter as &Minter 
    }

    // Helper function for square root calculation
    access(all) fun sqrt(y: UFix64): UFix64 {
        if y > 3.0 {
            var z: UFix64 = y
            var x: UFix64 = y / 2.0 + 1.0
            while x < z {
                z = x
                x = (y / x + x) / 2.0
            }
            return z
        } else if y != 0.0 {
            return 1.0
        } else {
            return 0.0
        }
    }

    // State variables
    access(all) var minter: &Minter

    init() {
        // Initialize constants
        self.FEE_DENOMINATOR = 10000.0
        self.SWAP_FEE = 30.0  // 0.3%
        self.MINIMUM_LIQUIDITY = 1000.0

        // Initialize state
        self.reserveA = 0.0
        self.reserveB = 0.0
        self.totalSupply = 0.0

        // Create minter
        self.minter <- create Minter()

        // Set up liquidity token vault
        let acct = self.account
        acct.save(<-create LiquidityVault(balance: 0.0), to: /storage/FlowDEXLiquidityVault)
        acct.link<&FlowDEX.LiquidityVault{FungibleToken.Receiver, FungibleToken.Balance}>(/public/FlowDEXLiquidityReceiver, target: /storage/FlowDEXLiquidityVault)
    }
}
