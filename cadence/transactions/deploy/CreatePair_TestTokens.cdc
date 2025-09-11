import FungibleToken from 0xFungibleToken
import DexFactory from 0xDexFactory
import DexPair from 0xDexPair
import TestToken from 0xTestToken
import TestToken2 from 0xTestToken2

transaction(id: String) {
    prepare(acct: AuthAccount) {}
    execute {
        let tokenAInfo = DexPair.TokenInfo(name: "TEST1", receiverPublicPath: /public/TestTokenReceiver, balancePublicPath: /public/TestTokenReceiver)
        let tokenBInfo = DexPair.TokenInfo(name: "TEST2", receiverPublicPath: /public/TestToken2Receiver, balancePublicPath: /public/TestToken2Receiver)
        let addr = DexFactory.createPair(
            id: id,
            tokenAInfo: tokenAInfo,
            tokenBInfo: tokenBInfo,
            emptyVaultA: <-TestToken.createEmptyVault(),
            emptyVaultB: <-TestToken2.createEmptyVault()
        )
    }
}
