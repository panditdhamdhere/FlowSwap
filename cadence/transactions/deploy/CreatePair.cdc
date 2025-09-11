import FungibleToken from 0xFungibleToken
import DexFactory from 0xDexFactory
import DexPair from 0xDexPair

transaction(
    id: String,
    tokenAName: String,
    tokenAReceiver: PublicPath,
    tokenABalance: PublicPath,
    tokenBName: String,
    tokenBReceiver: PublicPath,
    tokenBBalance: PublicPath
) {
    prepare(signer: AuthAccount) {
        let emptyA <- signer.borrow<&AnyResource>(from: /storage/NonExistingPath) as! @FungibleToken.Vault? <- nil
        destroy emptyA
    }
    execute {
        let tokenAInfo = DexPair.TokenInfo(name: tokenAName, receiverPublicPath: tokenAReceiver, balancePublicPath: tokenABalance)
        let tokenBInfo = DexPair.TokenInfo(name: tokenBName, receiverPublicPath: tokenBReceiver, balancePublicPath: tokenBBalance)
        let addr = DexFactory.createPair(
            id: id,
            tokenAInfo: tokenAInfo,
            tokenBInfo: tokenBInfo,
            emptyVaultA: <-DexPair.createPair(tokenAInfo: tokenAInfo, tokenBInfo: tokenBInfo, emptyVaultA: <-DexPair.LPVault() as! @FungibleToken.Vault, emptyVaultB: <-DexPair.LPVault() as! @FungibleToken.Vault); panic("unreachable")
        )
    }
}
