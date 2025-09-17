import { config } from '@onflow/fcl'

const emulator = {
  accessNode: 'http://localhost:8888',
  wallet: 'http://localhost:8701/fcl/authn',
  discovery: 'http://localhost:8701/fcl/authn',
  discoveryInclude: ['0xF8D6E0586B0A20C7'],
  network: 'emulator',
}

const testnet = {
  accessNode: 'https://rest-testnet.onflow.org',
  discovery: 'https://fcl-discovery.onflow.org/testnet/authn',
  wallet: 'https://fcl-discovery.onflow.org/testnet/authn',
  discoveryInclude: ['0x82ec283f88a62e65'], // Blocto wallet for faster connection
  network: 'testnet',
}

// Contract addresses
const CONTRACTS = {
  emulator: {
    FlowDEX: '0xf8d6e0586b0a20c7',
    TestToken: '0xf8d6e0586b0a20c7',
    TestToken2: '0xf8d6e0586b0a20c7',
    FungibleToken: '0xee82856bf20e2aa6',
  },
  testnet: {
    FlowDEX: '0x18f0d1d9cfa52c6d',
    TestToken: '0x18f0d1d9cfa52c6d',
    TestToken2: '0x0ea4b4ea56a1260c',
    FungibleToken: '0x9a0766d93b6608b7',
  }
}

export function initFCL(env: 'emulator' | 'testnet' = 'emulator') {
  const cfg = env === 'testnet' ? testnet : emulator
  const contracts = CONTRACTS[env]
  
  config()
    .put('app.detail.title', 'FlowSwap')
    .put('app.detail.icon', 'https://avatars.githubusercontent.com/u/62387156')
    .put('flow.network', cfg.network)
    .put('accessNode.api', cfg.accessNode)
    .put('discovery.wallet', cfg.wallet)
    .put('discovery.authn.endpoint', cfg.discovery)
    .put('discovery.authn.include', cfg.discoveryInclude)
    // Performance optimizations
    .put('fcl.limit', 9999)
    .put('fcl.gasLimit', 9999)
    .put('fcl.storageLimit', 1000)
    // Contract addresses
    .put('0xFlowDEX', contracts.FlowDEX)
    .put('0xTestToken', contracts.TestToken)
    .put('0xTestToken2', contracts.TestToken2)
    .put('0xFungibleToken', contracts.FungibleToken)
}

export { CONTRACTS }
