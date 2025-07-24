# Rollup Registration Guide

Complete guide for creating and preparing Tokamak rollup metadata files.

## 🎯 Overview

This guide covers how to create valid rollup metadata files, including field completion, signature generation, and local validation. For PR submission process, see [PR Process](pr-process.md).

## 📋 Prerequisites

### Technical Requirements
- ✅ Deployed rollup with SystemConfig contract
- ✅ Sequencer private key or signing authority
- ✅ **All L1/L2 contract addresses (For Thanos optimistic rollups, ALL contracts in l1Contracts and l2Contracts must be included. For other rollups, only deployed contracts are required.)**
- ✅ Network configuration information

### Environment Setup
- ✅ Node.js 18+ installed
- ✅ Git configured

## 🚀 Metadata Creation Process

### Step 1: Environment Setup

```bash
# Clone the repository (or work in your fork)
git clone https://github.com/tokamak-network/tokamak-rollup-metadata-repository.git
cd tokamak-rollup-metadata-repository

git checkout -b feature/add-rollup

# Install dependencies
npm install
```

> 💡 **No additional setup required!** The system uses public RPCs by default.

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

```bash
# 1. Copy the example JSON structure
cp schemas/example-rollup-metadata.json data/sepolia/0x5678901234567890123456789012345678901234.json

# 2. Create your JSON file following the L2RollupMetadata interface
vim data/sepolia/0x5678901234567890123456789012345678901234.json
```

> **⚠️ Important**:
> - **For Thanos optimistic rollups** (`rollupType: "optimistic"` AND `stack.name: "thanos"`): You must include ALL contracts in both `l1Contracts` and `l2Contracts` sections. The example file contains all required contracts - do not remove any of them.
> - **For other rollup types or stacks**: Only include the contracts that are actually deployed on your network. The example file shows all possible contracts, but you can remove those that don't apply to your rollup.
>
> Each contract address must be filled with the actual deployed address on your network.

### Step 4: Generate Sequencer Signature

Create a signature to prove sequencer ownership:

**Important**: The signer address must match the onchain sequencer address from the SystemConfig contract. Only the current on-chain sequencer can submit metadata.

#### Option A: Using HTML Signature Tool (Recommended)

The easiest way to generate signatures is using the provided HTML tool:

1. **Start a local server** (required for MetaMask connection):
   ```bash
   # Option 1: Using Python (if installed)
   cd src/sign
   python3 -m http.server 8000
   # Then open: http://localhost:8000

   # Option 2: Using Node.js npx
   cd src/sign
   npx http-server -p 8000
   # Then open: http://localhost:8000

   ```

2. **Open the signature tool**:
   ```bash
   # Open in your browser
   open http://localhost:8000
   ```

3. **Connect your MetaMask wallet**:
   - Click "Connect Wallet" button
   - Select your sequencer account in MetaMask
   - Ensure you're on the correct network

4. **Fill in the form**:
   - **Operation**: Select "register" (for new) or "update" (for existing)
   - **L1 Chain ID**: Enter the L1 chain ID (e.g., 11155111 for Sepolia)
   - **L2 Chain ID**: Enter your L2 rollup chain ID
   - **SystemConfig Address**: Enter your SystemConfig contract address

5. **Generate signature**:
   - Review the message preview
   - Click "Sign Message"
   - Approve the signature request in MetaMask
   - Copy the generated signature from the result box

6. **Add to metadata**:
   - Copy the signature and signedBy address
   - Paste into your metadata file's `metadata` section

> **⚠️ Important**: Direct file opening (`file://`) doesn't work with MetaMask due to browser security policies. You must use a local server.

#### Option B: Manual Signature Generation

If you prefer programmatic generation:

```javascript
// Message format for BOTH REGISTRATION AND UPDATES (with 24-hour validity)
const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp

const registerMessage = `Tokamak Rollup Registry
L1 Chain ID: ${l1ChainId}
L2 Chain ID: ${l2ChainId}
Operation: register
SystemConfig: ${SystemConfig.toLowerCase()}
Timestamp: ${timestamp}`;

const updateMessage = `Tokamak Rollup Registry
L1 Chain ID: ${l1ChainId}
L2 Chain ID: ${l2ChainId}
Operation: update
SystemConfig: ${SystemConfig.toLowerCase()}
Timestamp: ${timestamp}`;

// Generate signature using MetaMask or ethers.js
const signature = await signer.signMessage(message);
```

**Important**:
- **Use the correct operation type**: `register` for new rollups, `update` for metadata updates
- **24-hour validity**: Signatures expire 24 hours after timestamp generation
- **Submit promptly**: Create your PR within 24 hours to avoid signature expiration
- **Timestamp consistency**: Ensure signature timestamp matches metadata time fields
  - Register: signature timestamp should match `createdAt` time
  - Update: signature timestamp should match `lastUpdated` time

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

### Step 5: Local Validation

After creating your metadata and generating the signature, validate it locally before submitting a PR:

```bash
# Format
npx ts-node scripts/validate-metadata.ts --pr-title "[Operation] network systemConfig_address - RollupName" data/network/systemConfig_address.json

# Example for new rollup
npx ts-node scripts/validate-metadata.ts --pr-title "[Rollup] sepolia 0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9 - Poseidon" data/sepolia/0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9.json

# Example for update
npx ts-node scripts/validate-metadata.ts --pr-title "[Update] sepolia 0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9 - Poseidon" data/sepolia/0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9.json
```

This validation will check:
- ✅ JSON schema validation
- ✅ Contract address format validation
- ✅ OnChain sequencer verification
- ✅ Sequencer signature verification
- ✅ Timestamp-based replay protection
- ✅ File existence validation for operation type
- ✅ Immutable fields protection (for updates)
- ✅ Update timestamp validation (for updates)
- ✅ Network consistency validation
- ✅ PR title format validation

### Step 6: Submit PR

## ✅ Validation Checklist

Before submitting your PR, ensure:

### Technical Validation
- [ ] Filename matches SystemConfig address (lowercase)
- [ ] All required fields are populated
- [ ] **For Thanos optimistic rollups: ALL contracts in l1Contracts and l2Contracts are included**
- [ ] **For other rollups: Only deployed contracts are included**
- [ ] JSON is valid and properly formatted
- [ ] Ethereum addresses are lowercase
- [ ] URLs are accessible (HTTPS recommended, HTTP allowed)

### On-Chain Verification
- [ ] SystemConfig contract exists on specified network
- [ ] Sequencer address matches `unsafeBlockSigner()` result
- [ ] All contract addresses are deployed and accessible

### Signature Verification
- [ ] Message follows exact format
- [ ] Signature is valid and recoverable
- [ ] Signed by the correct sequencer address
- [ ] Signature timestamp is within 24 hours

### Update-Specific Validation (if updating)
- [ ] lastUpdated is within 1 hour of current time
- [ ] lastUpdated is after previous lastUpdated timestamp
- [ ] Only mutable fields are changed

### Metadata Quality
- [ ] RPC endpoint is accessible
- [ ] Bridge and explorer URLs are valid
- [ ] Logo image URL is accessible (if provided)

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
          "symbol": "TON",
          "l1Address": "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
          "l2Address": "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
          "decimals": 18,
          "isNativeToken": true
        },
        {
          "symbol": "ETH",
          "l1Address": "0x0000000000000000000000000000000000000000",
          "l2Address": "0x4200000000000000000000000000000000000006",
          "decimals": 18,
          "isWrappedETH": true
        }
      ]
    }
  ]
}
```

## 🔄 Updating Existing Metadata

### When to Update
Update your rollup metadata when:
- **Infrastructure changes**: New RPC endpoints, explorers, or bridges
- **Contract upgrades**: SystemConfig or other contract address changes
- **Status changes**: Active ↔ Inactive, maintenance mode

> **⚠️ Important**: Only the current on-chain sequencer can submit updates. The sequencer address must match the `unsafeBlockSigner()` result from the SystemConfig contract.

### Update Process

1. **Locate existing file**: Find your current metadata in `data/<network>/<SystemConfig>.json`
2. **Make necessary changes**: Update only the fields that have changed
3. **Generate new signature**: Use `Operation: update` in the signature message with current timestamp
4. **Create update PR**: Use `[Update]` prefix in PR title
5. **Submit within 24 hours**: Signature expires 24 hours after generation
6. **Validation**: System validates both new data and signature freshness

### Important Update Rules
- **SystemConfig address cannot change**: If your SystemConfig changes, it's a new rollup
- **L1 Chain ID cannot change**: L1 Chain ID is immutable for a rollup
- **L2 Chain ID can be corrected**: L2 Chain ID can be updated if initially entered incorrectly

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