import FungibleToken from 0xFungibleToken
import DexRouter from 0xDexRouter
import TestToken from 0xTestToken
import TestToken2 from 0xTestToken2

transaction(id: String, amountA: UFix64, amountB: UFix64) {
    prepare(acct: AuthAccount) {
        let vaultARef = acct.borrow<&TestToken.Vault>(from: /storage/TestTokenVault) ?? panic("missing vault A")
        let vaultBRef = acct.borrow<&TestToken2.Vault>(from: /storage/TestToken2Vault) ?? panic("missing vault B")
        let outA <- vaultARef.withdraw(amount: amountA)
        let outB <- vaultBRef.withdraw(amount: amountB)
        let lpReceiver <- create EmptyLPReceiver()
        destroy lpReceiver
    }
    execute {}
}

resource EmptyLPReceiver: FungibleToken.Receiver {
    pub fun deposit(from: @FungibleToken.Vault) { destroy from }
}
