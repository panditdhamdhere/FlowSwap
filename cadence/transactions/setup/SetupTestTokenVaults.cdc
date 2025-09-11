import FungibleToken from 0xFungibleToken
import TestToken from 0xTestToken
import TestToken2 from 0xTestToken2

transaction() {
    prepare(acct: AuthAccount) {
        if acct.borrow<&TestToken.Vault>(from: /storage/TestTokenVault) == nil {
            acct.save(<-TestToken.createEmptyVault(), to: /storage/TestTokenVault)
            acct.link<&TestToken.Vault{FungibleToken.Receiver, FungibleToken.Balance}>(/public/TestTokenReceiver, target: /storage/TestTokenVault)
        }
        if acct.borrow<&TestToken2.Vault>(from: /storage/TestToken2Vault) == nil {
            acct.save(<-TestToken2.createEmptyVault(), to: /storage/TestToken2Vault)
            acct.link<&TestToken2.Vault{FungibleToken.Receiver, FungibleToken.Balance}>(/public/TestToken2Receiver, target: /storage/TestToken2Vault)
        }
    }
}
