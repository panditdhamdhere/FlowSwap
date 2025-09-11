import FungibleToken from 0xFungibleToken
import TestToken from 0xTestToken
import TestToken2 from 0xTestToken2

transaction(amount1: UFix64, amount2: UFix64) {
    prepare(acct: AuthAccount) {
        let r1 = acct.getCapability(/public/TestTokenReceiver).borrow<&{FungibleToken.Receiver}>() ?? panic("missing receiver 1")
        let r2 = acct.getCapability(/public/TestToken2Receiver).borrow<&{FungibleToken.Receiver}>() ?? panic("missing receiver 2")
        let m1 = TestToken.createMinter()
        let m2 = TestToken2.createMinter()
        m1.mint(amount: amount1, recipient: r1)
        m2.mint(amount: amount2, recipient: r2)
    }
}
