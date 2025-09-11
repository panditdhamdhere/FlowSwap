import FungibleToken from 0xFungibleToken

pub contract TestToken: FungibleToken {

	pub let TotalSupply: UFix64

	pub var totalSupply: UFix64

	pub var tokenAdmin: &Admin{AdminPublic}

	pub var minter: &Minter

	pub resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
		pub var balance: UFix64

		init(balance: UFix64) {
			self.balance = balance
		}

		pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
			pre {
				amount > 0.0: "Amount must be positive"
				self.balance >= amount: "Insufficient balance"
			}
			self.balance = self.balance - amount
			return <-create Vault(balance: amount)
		}

		pub fun deposit(from: @FungibleToken.Vault) {
			let vault <- from as! @TestToken.Vault
			self.balance = self.balance + vault.balance
			destroy vault
		}

		pub fun getBalance(): UFix64 { return self.balance }
	}

	pub resource interface AdminPublic {
		pub fun setMinter(newMinter: &Minter)
	}

	pub resource Admin: AdminPublic {
		pub fun setMinter(newMinter: &Minter) { TestToken.minter = newMinter }
	}

	pub resource Minter {
		pub fun mint(amount: UFix64, recipient: &{FungibleToken.Receiver}) {
			pre { amount > 0.0: "Amount must be positive" }
			TestToken.totalSupply = TestToken.totalSupply + amount
			recipient.deposit(from: <-create Vault(balance: amount))
		}
	}

	pub fun createEmptyVault(): @FungibleToken.Vault { return <-create Vault(balance: 0.0) }

	pub fun createMinter(): &Minter { return &self.minter as &Minter }

	pub fun getAdminPublic(): &Admin{AdminPublic} { return self.tokenAdmin }

	init(initialSupply: UFix64) {
		self.TotalSupply = 1_000_000_000.0
		self.totalSupply = 0.0
		let admin <- create Admin()
		self.tokenAdmin <-&admin as &Admin{AdminPublic}
		self.minter <- create Minter()

		let acct = self.account
		acct.save(<-create Vault(balance: 0.0), to: /storage/TestTokenVault)
		acct.link<&TestToken.Vault{FungibleToken.Receiver, FungibleToken.Balance}>(/public/TestTokenReceiver, target: /storage/TestTokenVault)
		acct.link<&TestToken.Vault{FungibleToken.Balance}>(/private/TestTokenBalance, target: /storage/TestTokenVault)

		let receiverRef = acct.getCapability(/public/TestTokenReceiver)
			.borrow<&{FungibleToken.Receiver}>()
			?? panic("Missing TestTokenReceiver capability")
		self.minter.mint(amount: initialSupply, recipient: receiverRef)
	}
}
