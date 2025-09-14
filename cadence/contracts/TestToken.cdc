import FungibleToken from 0x9a0766d93b6608b7

access(all) contract TestToken: FungibleToken {

	access(all) let TotalSupply: UFix64

	access(all) var totalSupply: UFix64

	access(all) var tokenAdmin: &Admin

	access(all) var minter: &Minter

	access(all) resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
		access(all) var balance: UFix64

		init(balance: UFix64) {
			self.balance = balance
		}

		access(all) fun withdraw(amount: UFix64): @FungibleToken.Vault {
			pre {
				amount > 0.0: "Amount must be positive"
				self.balance >= amount: "Insufficient balance"
			}
			self.balance = self.balance - amount
			return <-create Vault(balance: amount)
		}

		access(all) fun deposit(from: @FungibleToken.Vault) {
			let vault <- from as! @TestToken.Vault
			self.balance = self.balance + vault.balance
			destroy vault
		}

		access(all) fun getBalance(): UFix64 { return self.balance }
	}

	access(all) resource Admin {
		access(all) fun setMinter(newMinter: &Minter) { TestToken.minter = newMinter }
	}

	access(all) resource Minter {
		access(all) fun mint(amount: UFix64, recipient: &{FungibleToken.Receiver}) {
			pre { amount > 0.0: "Amount must be positive" }
			TestToken.totalSupply = TestToken.totalSupply + amount
			recipient.deposit(from: <-create Vault(balance: amount))
		}
	}

	access(all) fun createEmptyVault(): @FungibleToken.Vault { return <-create Vault(balance: 0.0) }

	access(all) fun createMinter(): &Minter { return &self.minter as &Minter }

	access(all) fun getAdmin(): &Admin { return &self.tokenAdmin as &Admin }

	init(initialSupply: UFix64) {
		self.TotalSupply = 1_000_000_000.0
		self.totalSupply = 0.0
		let admin <- create Admin()
		self.tokenAdmin <-&admin as &Admin
		self.minter <- create Minter()

		let acct = self.account
		acct.save(<-create Vault(balance: 0.0), to: /storage/TestTokenVault)
		acct.link<&TestToken.Vault>(/public/TestTokenReceiver, target: /storage/TestTokenVault)
		acct.link<&TestToken.Vault>(/private/TestTokenBalance, target: /storage/TestTokenVault)

		let receiverRef = acct.getCapability(/public/TestTokenReceiver)
			.borrow<&{FungibleToken.Receiver}>()
			?? panic("Missing TestTokenReceiver capability")
		self.minter.mint(amount: initialSupply, recipient: receiverRef)
	}
}
