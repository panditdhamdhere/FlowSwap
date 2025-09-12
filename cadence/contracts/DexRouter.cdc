import FungibleToken from 0xee82856bf20e2aa6

pub contract DexRouter {

	pub event AddedLiquidity(id: String, liquidity: UFix64)
	pub event RemovedLiquidity(id: String, liquidity: UFix64)
	pub event Swapped(id: String, direction: String, amountIn: UFix64, amountOut: UFix64)

	pub fun getPairRef(id: String): &DexPair.Pair {
		let addr = DexFactory.getPair(id: id) ?? panic("pair not found")
		let cap = getAccount(addr).getCapability<&DexPair.Pair>(PublicPath(identifier: "/public/DexPair_".concat(id))!)
		return cap.borrow() ?? panic("pair cap missing")
	}

	pub fun addLiquidity(
		id: String,
		fromA: @FungibleToken.Vault,
		fromB: @FungibleToken.Vault,
		lpReceiver: &{FungibleToken.Receiver}
	): UFix64 {
		let pair = DexRouter.getPairRef(id: id)
		let liq = pair.addLiquidity(fromA: <-fromA, fromB: <-fromB, to: lpReceiver)
		emit AddedLiquidity(id: id, liquidity: liq)
		return liq
	}

	pub fun removeLiquidity(
		id: String,
		liquidity: UFix64,
		tokenAReceiver: &{FungibleToken.Receiver},
		tokenBReceiver: &{FungibleToken.Receiver}
	) {
		let pair = DexRouter.getPairRef(id: id)
		pair.removeLiquidity(liquidity: liquidity, toA: tokenAReceiver, toB: tokenBReceiver)
		emit RemovedLiquidity(id: id, liquidity: liquidity)
	}

	pub fun swapExactAForB(
		id: String,
		amountIn: UFix64,
		minOut: UFix64,
		fromA: @FungibleToken.Vault,
		toB: &{FungibleToken.Receiver}
	) {
		let pair = DexRouter.getPairRef(id: id)
		pair.swapExactAForB(amountIn: amountIn, minOut: minOut, fromA: <-fromA, toB: toB)
		emit Swapped(id: id, direction: "AtoB", amountIn: amountIn, amountOut: minOut)
	}

	pub fun swapExactBForA(
		id: String,
		amountIn: UFix64,
		minOut: UFix64,
		fromB: @FungibleToken.Vault,
		toA: &{FungibleToken.Receiver}
	) {
		let pair = DexRouter.getPairRef(id: id)
		pair.swapExactBForA(amountIn: amountIn, minOut: minOut, fromB: <-fromB, toA: toA)
		emit Swapped(id: id, direction: "BtoA", amountIn: amountIn, amountOut: minOut)
	}
}
