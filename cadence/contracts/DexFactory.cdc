import FungibleToken from 0xee82856bf20e2aa6

pub contract DexFactory {

	pub event PairCreated(id: String, address: Address)

	pub struct PairRecord { pub let id: String; pub let address: Address; init(id: String, address: Address) { self.id = id; self.address = address } }

	pub var pairs: {String: Address}

	pub fun getPair(id: String): Address? { return self.pairs[id] }

	pub fun createPair(
		id: String,
		tokenAInfo: DexPair.TokenInfo,
		tokenBInfo: DexPair.TokenInfo,
		emptyVaultA: @FungibleToken.Vault,
		emptyVaultB: @FungibleToken.Vault
	): Address {
		pre { self.pairs[id] == nil: "pair exists" }
		let pair <- DexPair.createPair(tokenAInfo: tokenAInfo, tokenBInfo: tokenBInfo, emptyVaultA: <-emptyVaultA, emptyVaultB: <-emptyVaultB)
		let storagePath = StoragePath(identifier: "DexPair_".concat(id))!
		self.account.save(<-pair, to: storagePath)
		let cap = self.account.link<&DexPair.Pair>(PublicPath(identifier: "/public/DexPair_".concat(id))!, target: storagePath)
		let addr = self.account.address
		self.pairs[id] = addr
		emit PairCreated(id: id, address: addr)
		return addr
	}

	init() { self.pairs = {} }
}
