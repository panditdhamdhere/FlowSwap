import FungibleToken from 0x9a0766d93b6608b7
import TestToken from 0x18f0d1d9cfa52c6d
import TestToken2 from 0x0ea4b4ea56a1260c

access(all) contract TestTokenFaucet {

    access(all) fun mintTestToken(amount: UFix64, to: Capability<&{FungibleToken.Receiver}>) {
        let receiver = to.borrow() ?? panic("Invalid receiver capability")
        let minter = TestToken.createMinter()
        minter.mint(amount: amount, recipient: receiver)
    }

    access(all) fun mintTestToken2(amount: UFix64, to: Capability<&{FungibleToken.Receiver}>) {
        let receiver = to.borrow() ?? panic("Invalid receiver capability")
        let minter = TestToken2.createMinter()
        minter.mint(amount: amount, recipient: receiver)
    }
}


