#!/bin/bash

echo "Flow DEX Deployment Script"
echo "========================="

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "Flow CLI is not installed. Please install it first."
    exit 1
fi

echo "Flow CLI version:"
flow version

echo ""
echo "Current flow.json configuration:"
cat flow.json

echo ""
echo "Attempting to deploy FlowDEX contract to testnet..."
echo "Account: p2 (0x91493e72be60e71e)"
echo "Contract: FlowDEX.cdc"

# Try to deploy
flow project deploy --network testnet

echo ""
echo "If deployment failed, you can try:"
echo "1. Check your internet connection"
echo "2. Verify the testnet endpoint is accessible"
echo "3. Ensure your account has sufficient FLOW tokens"
echo "4. Try using a different Flow CLI version"
