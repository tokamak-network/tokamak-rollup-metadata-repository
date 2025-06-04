# Rollup Registration Guide

A step-by-step guide for registering Tokamak rollup metadata.

## 🎯 Overview

This guide explains how to register rollup metadata in the Tokamak rollup metadata repository. Registration requires **sequencer signature** and **on-chain verification**.

## 📋 Prerequisites

### Technical Requirements
- ✅ Deployed rollup with SystemConfig contract
- ✅ Sequencer private key or signing authority
- ✅ All L1/L2 contract addresses
- ✅ Network configuration information

### Environment Setup
- ✅ Node.js 18+ installed
- ✅ Git configured
- ✅ GitHub account with repository access

## 🚀 Step-by-Step Registration

### Step 1: Repository Setup

```bash
# Clone the repository
git clone https://github.com/tokamak-network/tokamak-rollup-metadata-repository.git
cd tokamak-rollup-metadata-repository

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file to add your RPC URLs
```

### Step 2: Verify On-Chain Information

Before creating metadata, verify the on-chain sequencer address:

```bash
# Using Foundry cast
cast call $SYSTEM_CONFIG_ADDRESS "unsafeBlockSigner()" --rpc-url $RPC_URL

# Using ethers.js
const systemConfig = new ethers.Contract(systemConfigAddress, abi, provider);
const sequencer = await systemConfig.unsafeBlockSigner();
```

**Important**: The metadata sequencer address must match the on-chain address.

### Step 3: Create Metadata File

Create a new metadata file using the SystemConfig address as filename:

```bash
# Filename format: {systemConfig_address}.json
# Example: 0x5678901234567890123456789012345678901234.json

# Use the interactive generator
npm run create:metadata

# Or create manually
vim data/sepolia/0x5678901234567890123456789012345678901234.json
```

### Step 4: Fill Required Information

Complete all required fields in the metadata:

```json
{
  "chainId": 12345,
  "name": "My Awesome L2",
  "description": "An innovative L2 solution built with Tokamak SDK",
  "rollupType": "optimistic",
  "stack": {
    "name": "thanos",
    "version": "1.0.0"
  },
  "status": "active",
  "rpcUrl": "https://rpc.my-l2.com",
  "nativeToken": {
    "type": "eth",
    "symbol": "ETH",
    "name": "Ethereum",
    "decimals": 18
  },
  // ... other required fields
}
```

### Step 5: Generate Sequencer Signature

Create a signature to prove sequencer ownership:

```javascript
// Message format for NEW REGISTRATION
const registerMessage = `Tokamak Rollup Registry
Chain ID: ${chainId}
Operation: register
SystemConfig: ${systemConfig.toLowerCase()}`;

// Message format for UPDATES
const updateMessage = `Tokamak Rollup Registry
Chain ID: ${chainId}
Operation: update
SystemConfig: ${systemConfig.toLowerCase()}`;

// Generate signature using MetaMask or ethers.js
const signature = await signer.signMessage(message);
```

**Important**: Use the correct operation type:
- **`register`**: For new rollup registration
- **`update`**: For metadata updates

Add the signature to metadata:
```json
{
  "metadata": {
    "version": "1.0.0",
    "signature": "0x1234567890abcdef...",
    "signedBy": "0x5678901234567890123456789012345678901234"
  }
}
```

### Step 6: Local Validation

Run all validations locally before submitting:

```bash
# Complete validation
npm run validate data/sepolia/0x5678901234567890123456789012345678901234.json

# Individual validations
npm run validate:schema data/sepolia/0x5678901234567890123456789012345678901234.json
npm run validate:onchain data/sepolia/0x5678901234567890123456789012345678901234.json
npm run validate:signature data/sepolia/0x5678901234567890123456789012345678901234.json
```

### Step 7: Submit Pull Request

Create a branch and submit PR:

```bash
# Create branch
git checkout -b add-rollup-0x5678901234567890123456789012345678901234

# Add and commit
git add data/sepolia/0x5678901234567890123456789012345678901234.json
git commit -m "Add rollup metadata for 0x5678901234567890123456789012345678901234"

# Push and create PR
git push origin add-rollup-0x5678901234567890123456789012345678901234
```

**PR Title Format:**
```
# For new registration
[Rollup] sepolia - 0x5678901234567890123456789012345678901234 - My Awesome L2

# For metadata updates
[Update] sepolia - 0x5678901234567890123456789012345678901234 - My Awesome L2
```

## ✅ Validation Checklist

Before submitting your PR, ensure:

### Technical Validation
- [ ] Filename matches SystemConfig address (lowercase)
- [ ] All required fields are populated
- [ ] JSON is valid and properly formatted
- [ ] Ethereum addresses are lowercase
- [ ] URLs are accessible (HTTPS)

### On-Chain Verification
- [ ] SystemConfig contract exists on specified network
- [ ] Sequencer address matches `unsafeBlockSigner()` result
- [ ] All contract addresses are deployed and accessible

### Signature Verification
- [ ] Message follows exact format
- [ ] Signature is valid and recoverable
- [ ] Signed by the correct sequencer address
- [ ] Timestamp is recent (within 24 hours)

### Metadata Quality
- [ ] Chain ID is unique and not conflicting
- [ ] RPC endpoint responds correctly
- [ ] Bridge and explorer URLs work
- [ ] Logo image is accessible

## 🔧 Advanced Configuration

### Withdrawal Configuration

For withdrawal monitoring, add `withdrawalConfig`:

```json
{
  "withdrawalConfig": {
    "challengePeriod": 120,
    "expectedWithdrawalDelay": 1560,
    "monitoringInfo": {
      "l2OutputOracleAddress": "0x...",
      "outputProposedEventTopic": "0x4ee37ac2c786ec85e87592d3c5c8a1dd66f8496dda3f125d9ea8ca5f657629b6"
    },
    "supportResources": {
      "statusPageUrl": "https://status.my-l2.com",
      "supportContactUrl": "https://support.my-l2.com",
      "explorerWithdrawalGuideUrl": "https://docs.my-l2.com/withdrawals"
    }
  }
}
```

### Network Configuration

Include batch submission and output root frequencies:

```json
{
  "networkConfig": {
    "blockTime": 2,
    "gasLimit": "30000000",
    "batchSubmissionFrequency": 1440,
    "outputRootFrequency": 240
  }
}
```

### Bridge Information

Configure supported tokens for bridge integration:

```json
{
  "bridges": [
    {
      "name": "Native Bridge",
      "type": "native",
      "url": "https://bridge.my-l2.com",
      "supportedTokens": [
        {
          "symbol": "ETH",
          "l1Address": "0x0000000000000000000000000000000000000000",
          "l2Address": "0x0000000000000000000000000000000000000000",
          "decimals": 18,
          "isNativeToken": true
        }
      ]
    }
  ]
}
```

## 🚨 Common Issues and Solutions

### On-Chain Verification Failures
- **Issue**: Sequencer address mismatch
- **Solution**: Verify SystemConfig address and check `unsafeBlockSigner()`

### Signature Verification Failures
- **Issue**: Invalid signature
- **Solution**: Ensure message format is exact and signer matches sequencer

### Network Path Mismatches
- **Issue**: File in wrong network directory
- **Solution**: Place file in correct network folder based on chain ID

### RPC Endpoint Issues
- **Issue**: RPC not accessible
- **Solution**: Test endpoint manually and ensure HTTPS/CORS configuration

## 📞 Support

If you encounter issues during registration:

1. **Check Documentation**: Review all related docs in `/docs` folder
2. **Run Local Validation**: Use provided CLI tools for debugging
3. **GitHub Issues**: Report bugs or request features
4. **Community Support**: Join Tokamak Network Discord for help

## 🔗 Related Documentation

- [Metadata Schema](metadata-schema.md) - Detailed field explanations
- [Validation System](validation-system.md) - Understanding validation process
- [PR Process](pr-process.md) - Pull request submission guidelines
- [FAQ](faq.md) - Frequently asked questions

## 🔄 Updating Existing Metadata

### When to Update
Update your rollup metadata when:
- **Infrastructure changes**: New RPC endpoints, explorers, or bridges
- **Contract upgrades**: SystemConfig or other contract address changes
- **Status changes**: Active ↔ Inactive, maintenance mode
- **Staking changes**: Candidate status, voting power updates
- **Network configuration**: Block time, gas limits, batch frequencies

### Update Process

1. **Locate existing file**: Find your current metadata in `data/<network>/<systemConfig>.json`
2. **Make necessary changes**: Update only the fields that have changed
3. **Generate new signature**: Use `Operation: update` in the signature message
4. **Create update PR**: Use `[Update]` prefix in PR title
5. **Validation**: System validates both new data and signature

### Important Update Rules
- **SystemConfig address cannot change**: If your SystemConfig changes, it's a new rollup
- **Chain ID cannot change**: Chain ID is immutable for a rollup
- **Always use new signature**: Each update requires a fresh signature with current timestamp
- **Maintain sequencer authority**: Only the current on-chain sequencer can submit updates