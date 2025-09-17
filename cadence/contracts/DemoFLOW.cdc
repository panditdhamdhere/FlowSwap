import FungibleToken from 0x9a0766d93b6608b7

access(all) contract DemoFLOW: FungibleToken {
    access(all) var totalSupply: UFix64

    access(all) resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
        access(all) var balance: UFix64
        init(balance: UFix64) { self.balance = balance }
        access(all) fun withdraw(amount: UFix64): @FungibleToken.Vault {
            pre { amount > 0.0: "Amount must be positive"; self.balance >= amount: "Insufficient balance" }
            self.balance = self.balance - amount
            return <-create Vault(balance: amount)
        }
        access(all) fun deposit(from: @FungibleToken.Vault) {
            let v <- from as! @DemoFLOW.Vault
            self.balance = self.balance + v.balance
            destroy v
        }
    }

    access(all) resource Minter { access(all) fun mint(amount: UFix64, to: &{FungibleToken.Receiver}) { DemoFLOW.totalSupply = DemoFLOW.totalSupply + amount; to.deposit(from: <-create Vault(balance: amount)) } }

    access(all) fun createEmptyVault(): @FungibleToken.Vault { return <-create Vault(balance: 0.0) }

    // public faucet function (no admin checks; testnet only)
    access(all) fun faucetMint(to: Capability<&{FungibleToken.Receiver}>, amount: UFix64) {
        let minter <- create Minter()
        let receiver = to.borrow() ?? panic("invalid receiver cap")
        minter.mint(amount: amount, to: receiver)
        destroy minter
    }

    init() {
        self.totalSupply = 0.0
        let acct = self.account
        acct.save(<-create Vault(balance: 0.0), to: /storage/DemoFLOWVault)
        acct.link<&DemoFLOW.Vault>(/public/DemoFLOWReceiver, target: /storage/DemoFLOWVault)
    }
}


