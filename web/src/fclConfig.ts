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
  discoveryInclude: [],
  network: 'testnet',
}

export function initFCL(env: 'emulator' | 'testnet' = 'testnet') {
  const cfg = env === 'testnet' ? testnet : emulator
  config()
    .put('app.detail.title', 'Flow DEX')
    .put('app.detail.icon', 'https://avatars.githubusercontent.com/u/62387156')
    .put('flow.network', cfg.network)
    .put('accessNode.api', cfg.accessNode)
    .put('discovery.wallet', cfg.wallet)
    .put('discovery.authn.endpoint', cfg.discovery)
    .put('discovery.authn.include', cfg.discoveryInclude)
}
