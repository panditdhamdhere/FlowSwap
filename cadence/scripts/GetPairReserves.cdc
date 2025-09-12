import DexFactory from 0xDexFactory
import DexPair from 0xDexPair

pub fun main(pairId: String): (UFix64, UFix64) {
    let pairAddress = DexFactory.getPair(id: pairId) ?? panic("Pair not found")
    let pair = getAccount(pairAddress).getCapability<&DexPair.Pair>(PublicPath(identifier: "/public/DexPair_".concat(pairId))!)
        ?? panic("Could not borrow Pair reference")
    return pair.getReserves()
}
