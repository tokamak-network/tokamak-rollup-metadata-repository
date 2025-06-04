# Metadata Schema

Complete specification for Tokamak rollup metadata structure and validation rules.

## 🎯 Overview

This document defines the JSON schema for rollup metadata, including all required and optional fields, validation rules, and integration guidelines.

## 📋 Schema Structure

### Root Level Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": [
    "chainId",
    "name",
    "description",
    "rollupType",
    "stack",
    "rpcUrl",
    "nativeToken",
    "status",
    "l1Contracts",
    "sequencer",
    "metadata"
  ],
  "properties": {
    "chainId": { "type": "integer", "minimum": 1 },
    "name": { "type": "string", "minLength": 1, "maxLength": 100 },
    "description": { "type": "string", "minLength": 1, "maxLength": 500 },
    "rollupType": { "enum": ["optimistic", "zk"] },
    "stack": { "$ref": "#/definitions/Stack" },
    "rpcUrl": { "$ref": "#/definitions/HttpsUrl" },
    "nativeToken": { "$ref": "#/definitions/NativeToken" },
    "status": { "enum": ["active", "inactive", "deprecated"] },
    "l1Contracts": { "$ref": "#/definitions/L1Contracts" },
    "sequencer": { "$ref": "#/definitions/Sequencer" },
    "metadata": { "$ref": "#/definitions/Metadata" },
    "websocketUrl": { "$ref": "#/definitions/WssUrl" },
    "explorer": { "$ref": "#/definitions/Explorer" },
    "bridges": { "$ref": "#/definitions/Bridges" },
    "staking": { "$ref": "#/definitions/Staking" },
    "withdrawalConfig": { "$ref": "#/definitions/WithdrawalConfig" },
    "networkConfig": { "$ref": "#/definitions/NetworkConfig" }
  }
}
```

## 🔧 Required Fields

### Basic Information

#### chainId
- **Type**: `integer`
- **Required**: Yes
- **Validation**: Must be positive integer, unique across all rollups
- **Description**: Unique chain identifier for the L2 network

```json
{
  "chainId": 12345
}
```

#### name
- **Type**: `string`
- **Required**: Yes
- **Validation**: 1-100 characters, human-readable rollup name
- **Description**: Display name for the rollup

```json
{
  "name": "My Awesome L2"
}
```

#### description
- **Type**: `string`
- **Required**: Yes
- **Validation**: 1-500 characters, clear rollup description
- **Description**: Brief description of the rollup and its features

```json
{
  "description": "An innovative L2 solution built with Tokamak SDK"
}
```

#### rollupType
- **Type**: `enum`
- **Required**: Yes
- **Values**: `"optimistic"`, `"zk"`
- **Description**: Type of rollup technology used

```json
{
  "rollupType": "optimistic"
}
```

### Stack Information

#### stack
- **Type**: `object`
- **Required**: Yes
- **Description**: Information about the rollup stack and version

```json
{
  "stack": {
    "name": "thanos",
    "version": "1.0.0",
    "commit": "abc123def456",
    "documentation": "https://docs.tokamak.network/thanos"
  }
}
```

**Properties:**
- `name`: Stack name (`"thanos"`, `"op-stack"`, etc.)
- `version`: Semantic version string
- `commit`: Git commit hash (optional)
- `documentation`: Link to stack documentation (optional)

### Network Configuration

#### rpcUrl
- **Type**: `string`
- **Required**: Yes
- **Format**: HTTPS URL
- **Description**: Primary RPC endpoint for the L2 network

```json
{
  "rpcUrl": "https://rpc.my-l2.com"
}
```

#### websocketUrl
- **Type**: `string`
- **Required**: No
- **Format**: WebSocket URL (wss://)
- **Description**: WebSocket endpoint for real-time data

```json
{
  "websocketUrl": "wss://ws.my-l2.com"
}
```

### Native Token

#### nativeToken
- **Type**: `object`
- **Required**: Yes
- **Description**: Information about the rollup's native token

```json
{
  "nativeToken": {
    "type": "eth",
    "symbol": "ETH",
    "name": "Ethereum",
    "decimals": 18,
    "logoUrl": "https://assets.my-l2.com/eth-logo.png"
  }
}
```

**Supported Types:**
- `"eth"`: Native ETH
- `"erc20"`: Custom ERC20 token
- `"ton"`: Tokamak Network TON token

### Status

#### status
- **Type**: `enum`
- **Required**: Yes
- **Values**: `"active"`, `"inactive"`, `"deprecated"`
- **Description**: Current operational status

```json
{
  "status": "active"
}
```

## 🏗️ Contract Information

### L1 Contracts

#### l1Contracts
- **Type**: `object`
- **Required**: Yes
- **Description**: All deployed L1 contract addresses

```json
{
  "l1Contracts": {
    "systemConfig": "0x1234567890123456789012345678901234567890",
    "l1StandardBridge": "0x2345678901234567890123456789012345678901",
    "optimismPortal": "0x3456789012345678901234567890123456789012",
    "l2OutputOracle": "0x4567890123456789012345678901234567890123",
    "disputeGameFactory": "0x5678901234567890123456789012345678901234",
    "l1CrossDomainMessenger": "0x6789012345678901234567890123456789012345",
    "l1ERC721Bridge": "0x7890123456789012345678901234567890123456",
    "addressManager": "0x8901234567890123456789012345678901234567"
  }
}
```

### Sequencer Information

#### sequencer
- **Type**: `object`
- **Required**: Yes
- **Description**: Sequencer configuration and authority

```json
{
  "sequencer": {
    "address": "0x1234567890123456789012345678901234567890",
    "batcherAddress": "0x2345678901234567890123456789012345678901",
    "proposerAddress": "0x3456789012345678901234567890123456789012"
  }
}
```

**Properties:**
- `address`: Current sequencer address (must match SystemConfig.unsafeBlockSigner())
- `batcherAddress`: Address that submits batches to L1 (optional)
- `proposerAddress`: Address that proposes L2 output roots (optional)

## 🌉 Bridge and Explorer

### Explorer

#### explorer
- **Type**: `object`
- **Required**: No
- **Description**: Block explorer information

```json
{
  "explorer": {
    "name": "My L2 Explorer",
    "url": "https://explorer.my-l2.com",
    "apiUrl": "https://api.explorer.my-l2.com",
    "standard": "blockscout"
  }
}
```

### Bridges

#### bridges
- **Type**: `array`
- **Required**: No
- **Description**: Supported bridge protocols

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
        },
        {
          "symbol": "USDC",
          "l1Address": "0xa0b86a33e6c8b8b7f1b5a4e9ec04d9b8b12c3db4",
          "l2Address": "0xb1c75e89fc0c2e4b8e6d9f3b4a5c7b8f12e4d6c3",
          "decimals": 6,
          "isNativeToken": false,
          "logoUrl": "https://assets.my-l2.com/usdc-logo.png"
        }
      ]
    }
  ]
}
```

**Bridge Types:**
- `"native"`: Standard Optimism bridge
- `"third-party"`: External bridge protocol
- `"nft"`: NFT-specific bridge

## 💰 Staking Information

### staking
- **Type**: `object`
- **Required**: No
- **Description**: Ton Staking V2 candidate status

```json
{
  "staking": {
    "isCandidate": true,
    "candidateStatus": "active",
    "candidateAddress": "0x1234567890123456789012345678901234567890",
    "votingPower": "1000000000000000000000",
    "commissionRate": "5.0",
    "registrationDate": "2025-01-01T00:00:00Z"
  }
}
```

**Note**: This metadata is for status tracking only. Actual candidate registration happens through the Ton Staking V2 protocol separately.

## 💸 Withdrawal Configuration

### withdrawalConfig
- **Type**: `object`
- **Required**: No
- **Description**: Withdrawal monitoring and delay parameters

```json
{
  "withdrawalConfig": {
    "challengePeriod": 120,
    "expectedWithdrawalDelay": 1560,
    "monitoringInfo": {
      "l2OutputOracleAddress": "0x4567890123456789012345678901234567890123",
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

**Time Values (in seconds):**
- `challengePeriod`: 120 (2 minutes)
- `expectedWithdrawalDelay`: 1560 (26 minutes total)

### Network Configuration

#### networkConfig
- **Type**: `object`
- **Required**: No
- **Description**: Network operation parameters

```json
{
  "networkConfig": {
    "blockTime": 2,
    "gasLimit": "30000000",
    "batchSubmissionFrequency": 1440,
    "outputRootFrequency": 240,
    "maxTxPerBatch": 1000
  }
}
```

**Parameters:**
- `blockTime`: L2 block time in seconds
- `gasLimit`: Block gas limit
- `batchSubmissionFrequency`: Batch submission interval (seconds)
- `outputRootFrequency`: Output root proposal interval (seconds)
- `maxTxPerBatch`: Maximum transactions per batch

## 🔐 Metadata Signature

### metadata
- **Type**: `object`
- **Required**: Yes
- **Description**: Cryptographic proof of sequencer authority

```json
{
  "metadata": {
    "version": "1.0.0",
    "signature": "0x1234567890abcdef...",
    "signedBy": "0x1234567890123456789012345678901234567890",
    "signedAt": "2025-01-01T00:00:00Z",
    "message": "Tokamak Rollup Registry\nChain ID: 12345\nOperation: register\nTimestamp: 1704067200"
  }
}
```

**Signature Process:**
1. Format message exactly as shown
2. Sign with sequencer private key
3. Include signature and signer address
4. Timestamp must be recent (within 24 hours)

## 📏 Validation Rules

### Address Format
- All Ethereum addresses must be lowercase
- Must be valid 42-character hex strings
- Must include '0x' prefix

```json
{
  "✅ Correct": "0x1234567890123456789012345678901234567890",
  "❌ Incorrect": "0x1234567890123456789012345678901234567890" // uppercase
}
```

### URL Format
- HTTP/HTTPS protocols are both allowed
- Must be valid URI format
- WebSocket URLs must use 'ws://' or 'wss://' protocol

### File Naming
- Filename must match SystemConfig address (lowercase)
- Must be placed in correct network directory
- Format: `data/{network}/{systemConfig_address}.json`

### On-Chain Verification
- SystemConfig contract must exist on specified network
- Sequencer address must match `SystemConfig.unsafeBlockSigner()`
- All contract addresses must be deployed and valid

## 🔍 Schema Definitions

### Common Types

```json
{
  "definitions": {
    "EthereumAddress": {
      "type": "string",
      "pattern": "^0x[a-f0-9]{40}$",
      "description": "Lowercase Ethereum address"
    },
    "HttpsUrl": {
      "type": "string",
      "pattern": "^https://.+",
      "description": "HTTPS URL"
    },
    "WssUrl": {
      "type": "string",
      "pattern": "^wss://.+",
      "description": "WebSocket Secure URL"
    },
    "TokenAmount": {
      "type": "string",
      "pattern": "^[0-9]+$",
      "description": "Token amount as string"
    }
  }
}
```

### Complete Stack Definition

```json
{
  "Stack": {
    "type": "object",
    "required": ["name", "version"],
    "properties": {
      "name": {
        "type": "string",
        "enum": ["thanos", "op-stack", "arbitrum-nitro"]
      },
      "version": {
        "type": "string",
        "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
      },
      "commit": {
        "type": "string",
        "pattern": "^[a-f0-9]{7,40}$"
      },
      "documentation": {
        "$ref": "#/definitions/HttpsUrl"
      }
    }
  }
}
```

## 📊 Example Metadata

### Complete Example

```json
{
  "chainId": 12345,
  "name": "My Awesome L2",
  "description": "An innovative L2 solution built with Tokamak SDK",
  "rollupType": "optimistic",
  "stack": {
    "name": "thanos",
    "version": "1.0.0",
    "commit": "abc123def456",
    "documentation": "https://docs.tokamak.network/thanos"
  },
  "rpcUrl": "https://rpc.my-l2.com",
  "websocketUrl": "wss://ws.my-l2.com",
  "nativeToken": {
    "type": "eth",
    "symbol": "ETH",
    "name": "Ethereum",
    "decimals": 18,
    "logoUrl": "https://assets.my-l2.com/eth-logo.png"
  },
  "status": "active",
  "l1Contracts": {
    "systemConfig": "0x1234567890123456789012345678901234567890",
    "l1StandardBridge": "0x2345678901234567890123456789012345678901",
    "optimismPortal": "0x3456789012345678901234567890123456789012",
    "l2OutputOracle": "0x4567890123456789012345678901234567890123",
    "disputeGameFactory": "0x5678901234567890123456789012345678901234",
    "l1CrossDomainMessenger": "0x6789012345678901234567890123456789012345",
    "l1ERC721Bridge": "0x7890123456789012345678901234567890123456",
    "addressManager": "0x8901234567890123456789012345678901234567"
  },
  "sequencer": {
    "address": "0x1234567890123456789012345678901234567890",
    "batcherAddress": "0x2345678901234567890123456789012345678901",
    "proposerAddress": "0x3456789012345678901234567890123456789012"
  },
  "explorer": {
    "name": "My L2 Explorer",
    "url": "https://explorer.my-l2.com",
    "apiUrl": "https://api.explorer.my-l2.com",
    "standard": "blockscout"
  },
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
        },
        {
          "symbol": "USDC",
          "l1Address": "0xa0b86a33e6c8b8b7f1b5a4e9ec04d9b8b12c3db4",
          "l2Address": "0xb1c75e89fc0c2e4b8e6d9f3b4a5c7b8f12e4d6c3",
          "decimals": 6,
          "isNativeToken": false,
          "logoUrl": "https://assets.my-l2.com/usdc-logo.png"
        }
      ]
    }
  ],
  "staking": {
    "isCandidate": true,
    "candidateStatus": "active",
    "candidateAddress": "0x1234567890123456789012345678901234567890",
    "votingPower": "1000000000000000000000",
    "commissionRate": "5.0",
    "registrationDate": "2025-01-01T00:00:00Z"
  },
  "withdrawalConfig": {
    "challengePeriod": 120,
    "expectedWithdrawalDelay": 1560,
    "monitoringInfo": {
      "l2OutputOracleAddress": "0x4567890123456789012345678901234567890123",
      "outputProposedEventTopic": "0x4ee37ac2c786ec85e87592d3c5c8a1dd66f8496dda3f125d9ea8ca5f657629b6"
    },
    "supportResources": {
      "statusPageUrl": "https://status.my-l2.com",
      "supportContactUrl": "https://support.my-l2.com",
      "explorerWithdrawalGuideUrl": "https://docs.my-l2.com/withdrawals"
    }
  },
  "networkConfig": {
    "blockTime": 2,
    "gasLimit": "30000000",
    "batchSubmissionFrequency": 1440,
    "outputRootFrequency": 240,
    "maxTxPerBatch": 1000
  },
  "metadata": {
    "version": "1.0.0",
    "signature": "0x1234567890abcdef...",
    "signedBy": "0x1234567890123456789012345678901234567890",
    "signedAt": "2025-01-01T00:00:00Z",
    "message": "Tokamak Rollup Registry\nChain ID: 12345\nOperation: register\nTimestamp: 1704067200"
  }
}
```

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - How to create and submit metadata
- [Validation System](validation-system.md) - Automated validation rules
- [File Naming](file-naming.md) - Naming conventions and directory structure
- [Withdrawal Monitoring](withdrawal-monitoring.md) - withdrawalConfig implementation