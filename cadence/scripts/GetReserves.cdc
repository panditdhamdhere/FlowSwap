import FlowDEX from 0x91493e72be60e71e

access(all) fun main(): (UFix64, UFix64) {
    let dex = getAccount(0x91493e72be60e71e)
        .getCapability<&FlowDEX.DEX>(/public/flowDEX)
        .borrow() ?? panic("Could not borrow DEX reference")
    
    return dex.getReserves()
}
