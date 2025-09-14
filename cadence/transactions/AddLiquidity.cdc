import FlowDEX from 0x91493e72be60e71e
import FungibleToken from 0x9a0766d93b6608b7
import TestToken from 0xf8d6e0586b0a20c7
import TestToken2 from 0xf8d6e0586b0a20c7

transaction(amountA: UFix64, amountB: UFix64, minLiquidity: UFix64) {
    let tokenAVault: &FungibleToken.Vault
    let tokenBVault: &FungibleToken.Vault
    let dexRef: &FlowDEX
    let liquidityReceiver: &{FungibleToken.Receiver}

    prepare(acct: AuthAccount) {
        // Get token vaults
        self.tokenAVault = acct.getCapability<&FungibleToken.Vault>(/public/flowTokenVault)
            .borrow() ?? panic("Could not borrow Flow token vault")
        
        self.tokenBVault = acct.getCapability<&FungibleToken.Vault>(/public/testTokenVault)
            .borrow() ?? panic("Could not borrow TestToken vault")
        
        // Get DEX reference
        self.dexRef = acct.getCapability<&FlowDEX>(/public/flowDEX)
            .borrow() ?? panic("Could not borrow DEX reference")
        
        // Get liquidity token receiver
        self.liquidityReceiver = acct.getCapability<&{FungibleToken.Receiver}>(/public/FlowDEXLiquidityReceiver)
            .borrow() ?? panic("Could not borrow liquidity receiver")
    }

    execute {
        // Add liquidity to the DEX
        let liquidity = self.dexRef.addLiquidity(
            amountA: amountA,
            amountB: amountB,
            minLiquidity: minLiquidity
        )
        
        // Mint liquidity tokens to user
        self.dexRef.createMinter().mint(amount: liquidity, recipient: self.liquidityReceiver)
    }
}
