import FungibleToken from 0xee82856bf20e2aa6

access(all) contract TestToken2: FungibleToken {

	access(all) let TotalSupply: UFix64
	access(all) var totalSupply: UFix64
	access(all) var minter: &Minter

	access(all) resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
		access(all) var balance: UFix64
		init(balance: UFix64) { self.balance = balance }
		access(all) fun withdraw(amount: UFix64): @FungibleToken.Vault {
			pre { amount > 0.0: "Amount must be positive"; self.balance >= amount: "Insufficient balance" }
			self.balance = self.balance - amount
			return <-create Vault(balance: amount)
		}
		access(all) fun deposit(from: @FungibleToken.Vault) {
			let v <- from as! @TestToken2.Vault
			self.balance = self.balance + v.balance
			destroy v
		}
		access(all) fun getBalance(): UFix64 { return self.balance }
	}

	access(all) resource Minter {
		access(all) fun mint(amount: UFix64, recipient: &{FungibleToken.Receiver}) {
			pre { amount > 0.0: "Amount must be positive" }
			TestToken2.totalSupply = TestToken2.totalSupply + amount
			recipient.deposit(from: <-create Vault(balance: amount))
		}
	}

	access(all) fun createEmptyVault(): @FungibleToken.Vault { return <-create Vault(balance: 0.0) }
	access(all) fun createMinter(): &Minter { return &self.minter as &Minter }

	init(initialSupply: UFix64) {
		self.TotalSupply = 1_000_000_000.0
		self.totalSupply = 0.0
		self.minter <- create Minter()
		let acct = self.account
		acct.save(<-create Vault(balance: 0.0), to: /storage/TestToken2Vault)
		acct.link<&TestToken2.Vault>(/public/TestToken2Receiver, target: /storage/TestToken2Vault)
		let receiverRef = acct.getCapability(/public/TestToken2Receiver).borrow<&{FungibleToken.Receiver}>() ?? panic("Missing receiver")
		self.minter.mint(amount: initialSupply, recipient: receiverRef)
	}
}
