import FlowDEX from 0x91493e72be60e71e

transaction {
    prepare(acct: AuthAccount) {
        // Deploy the FlowDEX contract
        acct.contracts.add(name: "FlowDEX", code: FlowDEX.code)
    }
}
