import FungibleToken from 0xFungibleToken

pub fun main(address: Address, vaultPath: StoragePath): UFix64 {
    let account = getAccount(address)
    let vault = account.getCapability(vaultPath).borrow<&{FungibleToken.Balance}>()
        ?? panic("Could not borrow Balance reference to the Vault")
    return vault.balance
}
