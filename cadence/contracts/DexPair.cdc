import FungibleToken from 0xFungibleToken

pub contract DexPair {

	pub let FeeBps: UFix64

	pub event Mint(liquidity: UFix64, amountA: UFix64, amountB: UFix64, to: Address)
	pub event Burn(liquidity: UFix64, amountA: UFix64, amountB: UFix64, to: Address)
	pub event Swap(sender: Address, amountInA: UFix64, amountInB: UFix64, amountOutA: UFix64, amountOutB: UFix64, to: Address)
	pub event Sync(reserveA: UFix64, reserveB: UFix64)

	pub struct TokenInfo {
		pub let name: String
		pub let receiverPublicPath: PublicPath
		pub let balancePublicPath: PublicPath
		init(name: String, receiverPublicPath: PublicPath, balancePublicPath: PublicPath) {
			self.name = name
			self.receiverPublicPath = receiverPublicPath
			self.balancePublicPath = balancePublicPath
		}
	}

	pub resource LPVault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
		pub var balance: UFix64
		init() { self.balance = 0.0 }
		pub fun deposit(from: @FungibleToken.Vault) {
			let vault <- from as! @LPVault
			self.balance = self.balance + vault.balance
			destroy vault
		}
		pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
			pre { self.balance >= amount: "insufficient LP" }
			self.balance = self.balance - amount
			return <-create LPVault().withBalance(amount: amount)
		}
		pub fun getBalance(): UFix64 { return self.balance }
		access(contract) fun withBalance(amount: UFix64): @LPVault { let v <- create LPVault(); v.balance = amount; return <-v }
	}

	pub resource Pair {
		pub let tokenAInfo: TokenInfo
		pub let tokenBInfo: TokenInfo
		pub var vaultA: @FungibleToken.Vault
		pub var vaultB: @FungibleToken.Vault
		pub var reserveA: UFix64
		pub var reserveB: UFix64
		pub var lpTotalSupply: UFix64

		init(tokenAInfo: TokenInfo, tokenBInfo: TokenInfo, emptyVaultA: @FungibleToken.Vault, emptyVaultB: @FungibleToken.Vault) {
			self.tokenAInfo = tokenAInfo
			self.tokenBInfo = tokenBInfo
			self.vaultA <- emptyVaultA
			self.vaultB <- emptyVaultB
			self.reserveA = 0.0
			self.reserveB = 0.0
			self.lpTotalSupply = 0.0
		}

		access(contract) fun mintLP(to: &{FungibleToken.Receiver}, amount: UFix64) {
			self.lpTotalSupply = self.lpTotalSupply + amount
			to.deposit(from: <-create LPVault().withBalance(amount: amount))
		}

		access(contract) fun burnLP(amount: UFix64) { self.lpTotalSupply = self.lpTotalSupply - amount }

		pub fun sync() { emit Sync(reserveA: self.reserveA, reserveB: self.reserveB) }

		pub fun getReserves(): (UFix64, UFix64) { return (self.reserveA, self.reserveB) }

		pub fun addLiquidity(fromA: @FungibleToken.Vault, fromB: @FungibleToken.Vault, to: &{FungibleToken.Receiver}): UFix64 {
			let amountA = (fromA as! @AnyResource{FungibleToken.Balance}).getBalance()
			let amountB = (fromB as! @AnyResource{FungibleToken.Balance}).getBalance()

			self.vaultA.deposit(from: <-fromA)
			self.vaultB.deposit(from: <-fromB)

			let liquidity: UFix64 = self.lpTotalSupply == 0.0 ? (amountA) : (min(amountA * self.lpTotalSupply / self.reserveA, amountB * self.lpTotalSupply / self.reserveB))
			self.reserveA = self.vaultA.getBalance()
			self.reserveB = self.vaultB.getBalance()
			self.mintLP(to: to, amount: liquidity)
			emit Mint(liquidity: liquidity, amountA: amountA, amountB: amountB, to: to.owner?.address ?? 0x0)
			self.sync()
			return liquidity
		}

		pub fun removeLiquidity(liquidity: UFix64, toA: &{FungibleToken.Receiver}, toB: &{FungibleToken.Receiver}) {
			pre { liquidity > 0.0: "zero" }
			let amountA = liquidity * self.reserveA / self.lpTotalSupply
			let amountB = liquidity * self.reserveB / self.lpTotalSupply
			self.burnLP(amount: liquidity)
			let outA <- self.vaultA.withdraw(amount: amountA)
			let outB <- self.vaultB.withdraw(amount: amountB)
			toA.deposit(from: <-outA)
			toB.deposit(from: <-outB)
			self.reserveA = self.vaultA.getBalance()
			self.reserveB = self.vaultB.getBalance()
			emit Burn(liquidity: liquidity, amountA: amountA, amountB: amountB, to: toA.owner?.address ?? 0x0)
			self.sync()
		}

		pub fun swapExactAForB(amountIn: UFix64, minOut: UFix64, fromA: @FungibleToken.Vault, toB: &{FungibleToken.Receiver}) {
			let amountInNet = amountIn * (1.0 - DexPair.FeeBps)
			let out = amountInNet * self.reserveB / (self.reserveA + amountInNet)
			pre { out >= minOut: "slippage" }
			self.vaultA.deposit(from: <-fromA)
			let outB <- self.vaultB.withdraw(amount: out)
			toB.deposit(from: <-outB)
			self.reserveA = self.vaultA.getBalance()
			self.reserveB = self.vaultB.getBalance()
			emit Swap(sender: toB.owner?.address ?? 0x0, amountInA: amountIn, amountInB: 0.0, amountOutA: 0.0, amountOutB: out, to: toB.owner?.address ?? 0x0)
			self.sync()
		}

		pub fun swapExactBForA(amountIn: UFix64, minOut: UFix64, fromB: @FungibleToken.Vault, toA: &{FungibleToken.Receiver}) {
			let amountInNet = amountIn * (1.0 - DexPair.FeeBps)
			let out = amountInNet * self.reserveA / (self.reserveB + amountInNet)
			pre { out >= minOut: "slippage" }
			self.vaultB.deposit(from: <-fromB)
			let outA <- self.vaultA.withdraw(amount: out)
			toA.deposit(from: <-outA)
			self.reserveA = self.vaultA.getBalance()
			self.reserveB = self.vaultB.getBalance()
			emit Swap(sender: toA.owner?.address ?? 0x0, amountInA: 0.0, amountInB: amountIn, amountOutA: out, amountOutB: 0.0, to: toA.owner?.address ?? 0x0)
			self.sync()
		}
	}

	pub fun createPair(tokenAInfo: TokenInfo, tokenBInfo: TokenInfo, emptyVaultA: @FungibleToken.Vault, emptyVaultB: @FungibleToken.Vault): @Pair {
		return <-create Pair(tokenAInfo: tokenAInfo, tokenBInfo: tokenBInfo, emptyVaultA: <-emptyVaultA, emptyVaultB: <-emptyVaultB)
	}

	init() {
		self.FeeBps = 0.003
	}
}
