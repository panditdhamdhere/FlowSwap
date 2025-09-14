#!/bin/bash

# Flow DEX Deployment Script
echo "🚀 Starting Flow DEX deployment to testnet..."

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "❌ Flow CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're logged in
if ! flow accounts get; then
    echo "❌ Please log in to Flow CLI first: flow auth login"
    exit 1
fi

echo "📋 Current account info:"
flow accounts get

# Deploy contracts
echo "📦 Deploying contracts to testnet..."

# Deploy TestToken
echo "Deploying TestToken..."
flow accounts create --key p2 --signer p2
flow project deploy --network testnet --signer p2

# Deploy TestToken2
echo "Deploying TestToken2..."
flow accounts create --key pandit --signer pandit
flow project deploy --network testnet --signer pandit

# Deploy FlowDEX
echo "Deploying FlowDEX..."
flow project deploy --network testnet --signer p2

echo "✅ Deployment completed!"
echo "📊 Contract addresses:"
echo "TestToken: $(flow accounts get p2 --network testnet | grep 'Address' | cut -d' ' -f2)"
echo "TestToken2: $(flow accounts get pandit --network testnet | grep 'Address' | cut -d' ' -f2)"
echo "FlowDEX: $(flow accounts get p2 --network testnet | grep 'Address' | cut -d' ' -f2)"

echo "🎉 Flow DEX is now live on testnet!"
