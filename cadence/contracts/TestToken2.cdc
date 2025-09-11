import FungibleToken from 0xFungibleToken

pub contract TestToken2: FungibleToken {

	pub let TotalSupply: UFix64
	pub var totalSupply: UFix64
	pub var minter: &Minter

	pub resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
		pub var balance: UFix64
		init(balance: UFix64) { self.balance = balance }
		pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
			pre { amount > 0.0: "positive"; self.balance >= amount: "insufficient" }
			self.balance = self.balance - amount
			return <-create Vault(balance: amount)
		}
		pub fun deposit(from: @FungibleToken.Vault) {
			let v <- from as! @TestToken2.Vault
			self.balance = self.balance + v.balance
			destroy v
		}
		pub fun getBalance(): UFix64 { return self.balance }
	}

	pub resource Minter {
		pub fun mint(amount: UFix64, recipient: &{FungibleToken.Receiver}) {
			pre { amount > 0.0: "positive" }
			TestToken2.totalSupply = TestToken2.totalSupply + amount
			recipient.deposit(from: <-create Vault(balance: amount))
		}
	}

	pub fun createEmptyVault(): @FungibleToken.Vault { return <-create Vault(balance: 0.0) }
	pub fun createMinter(): &Minter { return &self.minter as &Minter }

	init(initialSupply: UFix64) {
		self.TotalSupply = 1_000_000_000.0
		self.totalSupply = 0.0
		self.minter <- create Minter()
		let acct = self.account
		acct.save(<-create Vault(balance: 0.0), to: /storage/TestToken2Vault)
		acct.link<&TestToken2.Vault{FungibleToken.Receiver, FungibleToken.Balance}>(/public/TestToken2Receiver, target: /storage/TestToken2Vault)
		let receiverRef = acct.getCapability(/public/TestToken2Receiver).borrow<&{FungibleToken.Receiver}>() ?? panic("Missing receiver")
		self.minter.mint(amount: initialSupply, recipient: receiverRef)
	}
}
