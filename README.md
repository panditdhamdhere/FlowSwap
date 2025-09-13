# Flow DEX - Decentralized Exchange on Flow Blockchain

A production-ready decentralized exchange (DEX) built on the Flow blockchain using Cadence smart contracts and React frontend.

## Features

- **Automated Market Maker (AMM)**: Constant product formula for price discovery
- **Liquidity Pools**: Add and remove liquidity from trading pairs
- **Token Swaps**: Swap between different tokens with slippage protection
- **Modern UI**: Beautiful, responsive interface with animations
- **Flow Integration**: Built with Flow Client Library (FCL)

## Architecture

### Smart Contracts (Cadence)
- `FlowDEX.cdc`: Main DEX contract with liquidity and swap functionality
- `TestToken.cdc`: Test fungible token for development
- `TestToken2.cdc`: Second test token for trading pairs

### Frontend (React + TypeScript)
- Modern React application with TypeScript
- Flow Client Library (FCL) for blockchain interaction
- Tailwind CSS for styling
- Framer Motion for animations
- Zustand for state management

## Project Structure

```
├── cadence/
│   ├── contracts/          # Smart contracts
│   ├── transactions/       # Transaction templates
│   └── scripts/           # Query scripts
├── web/                   # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── transactions.ts # FCL transaction functions
│   │   └── fclConfig.ts   # Flow configuration
│   └── package.json
├── flow.json             # Flow project configuration
└── deploy.sh            # Deployment script
```

## Getting Started

### Prerequisites
- Node.js 16+
- Flow CLI
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/panditdhamdhere/FlowSwap.git
cd FlowSwap
```

2. Install frontend dependencies:
```bash
cd web
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Deployment

#### Deploy to Flow Testnet

1. Ensure you have a Flow testnet account with FLOW tokens
2. Update the contract addresses in `flow.json` if needed
3. Run the deployment script:
```bash
./deploy.sh
```

Or deploy manually:
```bash
flow project deploy --network testnet
```

#### Deploy to Flow Mainnet

1. Update `flow.json` with mainnet addresses
2. Ensure your account has sufficient FLOW tokens
3. Deploy:
```bash
flow project deploy --network mainnet
```

## Configuration

### Flow Configuration (`flow.json`)
- Contract addresses and aliases
- Network endpoints (emulator, testnet, mainnet)
- Account configurations
- Deployment settings

### Frontend Configuration (`web/src/fclConfig.ts`)
- Network selection (emulator/testnet/mainnet)
- Access node endpoints
- Wallet discovery settings

## Smart Contract Details

### FlowDEX Contract
- **addLiquidity**: Add liquidity to the pool
- **swapAForB**: Swap token A for token B
- **getReserveA/getReserveB**: Get current reserves
- **Events**: LiquidityAdded, SwapExecuted

### Security Features
- Input validation with pre-conditions
- Slippage protection
- Reentrancy protection
- Access control

## Frontend Features

### Wallet Integration
- Connect with Flow-compatible wallets
- Account management
- Transaction signing

### Trading Interface
- Add/remove liquidity
- Token swaps
- Real-time price updates
- Balance display

### UI/UX
- Responsive design
- Dark/light theme support
- Smooth animations
- Error handling and notifications

## Development

### Local Development
1. Start Flow emulator:
```bash
flow emulator --contracts --persist
```

2. Deploy contracts to emulator:
```bash
flow project deploy --network emulator
```

3. Start frontend:
```bash
cd web && npm run dev
```

### Testing
- Smart contract testing with Flow CLI
- Frontend testing with Jest/React Testing Library
- Integration testing with testnet

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Create an issue on GitHub
- Join the Flow Discord community
- Check Flow documentation at https://developers.flow.com

## Roadmap

- [ ] Multi-token support
- [ ] Advanced trading features
- [ ] Governance token
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] Cross-chain bridges