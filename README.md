##### Built on Flow

### DeFi DEX on Flow (Cadence)
This repo contains a minimal AMM DEX (constant-product) built on Flow.

- Contracts: `TestToken`, `DexPair`, `DexFactory`, `DexRouter`
- Transactions: create pair, add/remove liquidity, swaps
- Scripts: query reserves, pair address, quote amounts

## Prerequisites
- Install Flow CLI: see `https://docs.onflow.org/flow-cli/install/`
- Node 18+ (optional)

## Setup
1. Start emulator:
```bash
flow emulator --contracts|cat
```
2. In a new terminal, deploy contracts:
```bash
flow project deploy --network emulator|cat
```

## Usage (Emulator)
- Create a pair (example: `TEST`/`TEST2`):
```bash
# TODO: fill create pair transaction once added
```
- Add liquidity, swap, remove liquidity via provided transactions in `cadence/transactions`.
- Query reserves and addresses with scripts in `cadence/scripts`.

## Security & Production Notes
- This is an educational baseline, not audited.
- Add: fee collection, pausability, access control, reentrancy protections, invariant checks.
- Use code reviews, property tests, and an external audit before mainnet.
- Keep compiler and dependencies up to date.

## Addresses
- `FungibleToken`: aliases in `flow.json`
- All custom contracts deployed under the deploying account; see `flow.json` aliases.
