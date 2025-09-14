import FungibleToken from 0x9a0766d93b6608b7

access(all) fun main(account: Address, tokenType: String): UFix64 {
    let account = getAccount(account)
    
    if tokenType == "FLOW" {
        let vault = account.getCapability<&FungibleToken.Vault>(/public/flowTokenVault)
            .borrow() ?? panic("Could not borrow Flow token vault")
        return vault.balance
    } else {
        let vault = account.getCapability<&FungibleToken.Vault>(/public/testTokenVault)
            .borrow() ?? panic("Could not borrow TestToken vault")
        return vault.balance
    }
}
