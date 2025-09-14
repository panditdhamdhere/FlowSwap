import FlowDEX from 0xf8d6e0586b0a20c7

access(all) fun main(): [UFix64] {
    return [FlowDEX.getReserveA(), FlowDEX.getReserveB()]
}