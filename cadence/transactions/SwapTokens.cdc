import FlowDEX from 0x91493e72be60e71e
import FungibleToken from 0x9a0766d93b6608b7
import TestToken from 0xf8d6e0586b0a20c7
import TestToken2 from 0xf8d6e0586b0a20c7

transaction(amountIn: UFix64, minAmountOut: UFix64, tokenInType: String) {
    let tokenInVault: &FungibleToken.Vault
    let tokenOutVault: &FungibleToken.Vault
    let dexRef: &FlowDEX

    prepare(acct: AuthAccount) {
        // Get appropriate vaults based on token type
        if tokenInType == "FLOW" {
            self.tokenInVault = acct.getCapability<&FungibleToken.Vault>(/public/flowTokenVault)
                .borrow() ?? panic("Could not borrow Flow token vault")
            self.tokenOutVault = acct.getCapability<&FungibleToken.Vault>(/public/testTokenVault)
                .borrow() ?? panic("Could not borrow TestToken vault")
        } else {
            self.tokenInVault = acct.getCapability<&FungibleToken.Vault>(/public/testTokenVault)
                .borrow() ?? panic("Could not borrow TestToken vault")
            self.tokenOutVault = acct.getCapability<&FungibleToken.Vault>(/public/flowTokenVault)
                .borrow() ?? panic("Could not borrow Flow token vault")
        }
        
        // Get DEX reference
        self.dexRef = acct.getCapability<&FlowDEX>(/public/flowDEX)
            .borrow() ?? panic("Could not borrow DEX reference")
    }

    execute {
        // Execute the swap based on direction
        let amountOut: UFix64
        if tokenInType == "FLOW" {
            amountOut = self.dexRef.swapAForB(amountIn: amountIn, minAmountOut: minAmountOut)
        } else {
            amountOut = self.dexRef.swapBForA(amountIn: amountIn, minAmountOut: minAmountOut)
        }
        
        // Transfer tokens (this would need to be implemented with proper token transfers)
        // For now, we assume the DEX handles the transfers internally
    }
}
