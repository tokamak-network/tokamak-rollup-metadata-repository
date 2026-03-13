# Tokamak Appchain Registration Guide

How to register your Tokamak Appchain on the Platform Explore page.

## Overview

This guide covers registering appchains deployed with **Tokamak-native stacks** (Tokamak Appchain, Private App Channel, py-ethclient). For Thanos stack rollups, see [Registration Guide](registration-guide.md).

**Key differences from Thanos registration:**

| | Thanos | Tokamak Appchain |
|---|---|---|
| Directory | `data/{network}/` | `tokamak-appchain-data/{l1ChainId}/{stackType}/` |
| Filename | `{SystemConfig}.json` | `{identityContract}.json` |
| Identity contract | SystemConfig | OnChainProposer (varies by stack) |
| Schema | `rollup-metadata.ts` | `tokamak-appchain-metadata.ts` |

## Prerequisites

- Deployed appchain with identity contract on L1 (e.g., `OnChainProposer`)
- Deployer/operator private key for signing
- Node.js 18+

## Step 1: Setup

```bash
git clone https://github.com/tokamak-network/tokamak-rollup-metadata-repository.git
cd tokamak-rollup-metadata-repository
git checkout -b feat/add-appchain-{your-name}
npm install
```

## Step 2: Determine Your File Path

The file path encodes three identity fields:

```
tokamak-appchain-data/{l1ChainId}/{stackType}/{identityContract}.json
```

| Field | Description | Example |
|-------|-------------|---------|
| `l1ChainId` | L1 chain where contracts are deployed | `11155111` (Sepolia), `1` (Mainnet) |
| `stackType` | Stack used to deploy | `tokamak-appchain`, `thanos`, `py-ethclient` |
| `identityContract` | Primary identity contract address | `0x1234...abcd` (lowercase) |

**Identity contract per stack type:**

| Stack Type | Identity Contract | Description |
|------------|------------------|-------------|
| `tokamak-appchain` | `OnChainProposer` | Batch commitment + proof verification |
| `thanos` | `SystemConfig` | System configuration contract |
| `tokamak-private-app-channel` | TBD | Private application channel |
| `py-ethclient` | TBD | Python Ethereum client |

**Example path:**
```
tokamak-appchain-data/11155111/tokamak-appchain/0xabcdef0123456789abcdef0123456789abcdef01.json
```

## Step 3: Create Metadata JSON

Copy the example and fill in your values:

```bash
# Create directory structure
mkdir -p tokamak-appchain-data/11155111/tokamak-appchain

# Copy example
cp schemas/example-tokamak-appchain.json \
   tokamak-appchain-data/11155111/tokamak-appchain/0x{YOUR_IDENTITY_CONTRACT}.json
```

### Required Fields

```json
{
  "l1ChainId": 11155111,
  "l2ChainId": 49201,
  "name": "My Appchain",
  "description": "Description of my appchain",

  "stackType": "tokamak-appchain",
  "rollupType": "zk",

  "rpcUrl": "https://rpc.my-appchain.com",

  "nativeToken": {
    "type": "eth",
    "symbol": "ETH",
    "name": "Ether",
    "decimals": 18
  },

  "status": "active",
  "createdAt": "2026-03-01T10:00:00Z",
  "lastUpdated": "2026-03-01T10:00:00Z",

  "l1Contracts": {
    "OnChainProposer": "0x..."
  },

  "operator": {
    "address": "0x..."
  },

  "metadata": {
    "version": "1.0.0",
    "signature": "0x...",
    "signedBy": "0x..."
  }
}
```

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `logo` | URL | Appchain logo image |
| `website` | URL | Project website |
| `wsUrl` | URL | WebSocket RPC endpoint |
| `stackVersion` | string | Stack version (e.g., `"1.0.0"`) |
| `nativeToken.l1Address` | address | Required when `nativeToken.type` is `"erc20"` |
| `l1Contracts.CommonBridge` | address | L1 bridge contract |
| `l1Contracts.Timelock` | address | Timelock governance contract |
| `l1Contracts.SP1Verifier` | address | SP1 proof verifier |
| `l1Contracts.GuestProgramRegistry` | address | Guest program registry |
| `l2Contracts` | object | L2-side contract addresses |
| `bridges` | array | Bridge endpoints and supported tokens |
| `explorers` | array | Block explorer URLs |
| `networkConfig` | object | Block time, gas limit |
| `supportResources` | object | Documentation, community links |
| `staking` | object | Tokamak Staking V2 candidate info |
| `withdrawalConfig` | object | Challenge period, monitoring |

See `schemas/tokamak-appchain-metadata.ts` for the full type definition.

## Step 4: Generate Signature

The signature proves you are the authorized operator of this appchain.

### Message Format

```
Tokamak Appchain Registry
L1 Chain ID: {l1ChainId}
L2 Chain ID: {l2ChainId}
Stack: {stackType}
Operation: register
Contract: {identityContract_lowercase}
Timestamp: {unixTimestamp}
```

### Using ethers.js

```javascript
const { ethers } = require("ethers");

const wallet = new ethers.Wallet("0x_YOUR_PRIVATE_KEY");
const timestamp = Math.floor(Date.now() / 1000);

const message = `Tokamak Appchain Registry
L1 Chain ID: 11155111
L2 Chain ID: 49201
Stack: tokamak-appchain
Operation: register
Contract: 0xabcdef0123456789abcdef0123456789abcdef01
Timestamp: ${timestamp}`;

const signature = await wallet.signMessage(message);
console.log("signature:", signature);
console.log("signedBy:", wallet.address);
```

### Using the HTML Signature Tool

```bash
cd src/sign && python3 -m http.server 8000
# Open http://localhost:8000 and connect MetaMask
```

**Important:**
- Signatures expire 24 hours after timestamp
- For updates, use `Operation: update`
- `signedBy` must match the on-chain operator/deployer address

## Step 5: Validate Locally

```bash
npm run build

# Validate your metadata file
npx ts-node scripts/validate-metadata.ts \
  --pr-title "[Appchain] 11155111/tokamak-appchain/0xabcdef...01 - My Appchain" \
  tokamak-appchain-data/11155111/tokamak-appchain/0xabcdef0123456789abcdef0123456789abcdef01.json
```

The validator checks:
- JSON schema conformance
- Address format (0x-prefixed, 40 hex chars, lowercase)
- Identity contract matches filename
- L1 chain ID matches directory path
- Signature validity and 24-hour expiry
- RPC endpoint liveness (when reachable)

## Step 6: Submit PR

### PR Title Format

```
[Appchain] {l1ChainId}/{stackType}/{identityContract} - {name}
```

Example:
```
[Appchain] 11155111/tokamak-appchain/0xabcdef0123456789abcdef0123456789abcdef01 - My Appchain
```

### What Happens After PR

1. **CI validation** runs automatically (schema, signature, on-chain checks)
2. **Maintainer review** for quality and accuracy
3. **Merge to main** triggers Platform sync
4. **Platform syncs** within 5 minutes (GitHub Git Trees API polling)
5. **Your appchain appears** on the Explore page

## Updating Existing Metadata

1. Edit your existing JSON file
2. Update `lastUpdated` to current ISO 8601 timestamp
3. Generate new signature with `Operation: update`
4. Submit PR with title: `[Update] {l1ChainId}/{stackType}/{identityContract} - {name}`

### Immutable Fields (cannot change after registration)

- `l1ChainId`
- `l2ChainId`
- `stackType`
- `createdAt`
- Identity contract address (in `l1Contracts`)

## Removing Your Appchain

To remove your appchain from the Platform:

1. Delete your JSON file
2. Submit PR with title: `[Remove] {l1ChainId}/{stackType}/{identityContract} - {name}`
3. After merge, the Platform removes the listing within 5 minutes

## Troubleshooting

### "Schema validation failed"
- Check required fields are present
- Ensure addresses are lowercase, 0x-prefixed, 42 chars
- Verify `nativeToken.l1Address` is set when `type` is `"erc20"`

### "Signature verification failed"
- Ensure message format matches exactly (including newlines)
- Check that `signedBy` matches the signing wallet
- Verify signature hasn't expired (24-hour window)

### "Identity contract mismatch"
- Filename must match the identity contract in `l1Contracts`
- For `tokamak-appchain`, this is `l1Contracts.OnChainProposer`

### My appchain doesn't appear on Platform
- Check the PR was merged to `main`
- Wait up to 5 minutes for sync
- Verify `status` is `"active"`

## Related Documentation

- [Tokamak Appchain Schema](../schemas/tokamak-appchain-metadata.ts) — Full type definition
- [Example Metadata](../schemas/example-tokamak-appchain.json) — Complete example
- [Validation System](validation-system.md) — CI validation details
- [Thanos Registration Guide](registration-guide.md) — For Thanos stack rollups
