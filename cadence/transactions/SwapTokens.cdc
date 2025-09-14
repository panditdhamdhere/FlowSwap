import FlowDEX from 0x91493e72be60e71e
import FungibleToken from 0x9a0766d93b6608b7
import TestToken from 0xf8d6e0586b0a20c7
import TestToken2 from 0xf8d6e0586b0a20c7

transaction(amountIn: UFix64, minAmountOut: UFix64, tokenInType: String) {
    let tokenInVault: &FungibleToken.Vault
    let tokenOutVault: &FungibleToken.Vault
    let dexRef: &FlowDEX.DEX

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
        self.dexRef = acct.getCapability<&FlowDEX.DEX>(/public/flowDEX)
            .borrow() ?? panic("Could not borrow DEX reference")
    }

    execute {
        // Execute the swap
        self.dexRef.swap(
            tokenInVault: &self.tokenInVault,
            tokenOutVault: &self.tokenOutVault,
            amountIn: amountIn,
            minAmountOut: minAmountOut
        )
    }
}
