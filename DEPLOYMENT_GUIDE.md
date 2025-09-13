# FlowSwap DEX Deployment Guide

## Current Status
- ✅ Frontend is ready and configured
- ✅ Smart contracts are written and tested
- ⚠️ Deployment to testnet has connectivity issues
- ⚠️ Emulator setup needs configuration

## Manual Deployment Steps

### Option 1: Deploy to Testnet (Recommended)

1. **Create a new Flow account:**
   ```bash
   flow keys generate
   ```

2. **Get testnet FLOW tokens:**
   - Visit: https://testnet-faucet.onflow.org/
   - Enter your public key
   - Create account and get testnet FLOW

3. **Update flow.json:**
   - Add your new account to the accounts section
   - Update the deployment section to use your account

4. **Deploy the contract:**
   ```bash
   flow project deploy --network testnet
   ```

5. **Update frontend addresses:**
   - Update the contract addresses in `web/src/transactions.ts`
   - Update the addresses in `web/src/hooks/usePairData.ts`

### Option 2: Use Emulator (For Development)

1. **Start the emulator:**
   ```bash
   flow emulator --contracts --persist
   ```

2. **Deploy contracts:**
   ```bash
   flow project deploy --network emulator
   ```

3. **Update frontend to use emulator:**
   - The frontend is already configured for emulator
   - Start the frontend: `cd web && npm run dev`

## Contract Addresses

### Emulator (Current Setup)
- FlowDEX: `0xf8d6e0586b0a20c7`
- FungibleToken: `0xee82856bf20e2aa6`

### Testnet (To be deployed)
- FlowDEX: `0x[YOUR_DEPLOYED_ADDRESS]`
- FungibleToken: `0x9a0766d93b6608b7`

## Frontend Configuration

The frontend is currently configured to work with the emulator. To switch to testnet:

1. Update `web/src/fclConfig.ts`:
   ```typescript
   initFCL('testnet')
   ```

2. Update contract addresses in:
   - `web/src/transactions.ts`
   - `web/src/hooks/usePairData.ts`

## Testing the DApp

1. **Start the frontend:**
   ```bash
   cd web
   npm run dev
   ```

2. **Connect wallet:**
   - Use Flow wallet (Blocto, Lilico, etc.)
   - Connect to the appropriate network (emulator/testnet)

3. **Test functionality:**
   - Add liquidity to the pool
   - Perform token swaps
   - Check pool information

## Troubleshooting

### Emulator Issues
- Make sure Flow CLI is up to date
- Check if port 3569 is available
- Try restarting the emulator

### Testnet Issues
- Check internet connection
- Try different testnet endpoints
- Ensure account has sufficient FLOW tokens

### Frontend Issues
- Check browser console for errors
- Verify contract addresses are correct
- Ensure FCL is properly configured
