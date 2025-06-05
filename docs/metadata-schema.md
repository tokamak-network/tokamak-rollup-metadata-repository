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
    "l1ChainId",
    "l2ChainId",
    "name",
    "description",
    "rollupType",
    "stack",
    "rpcUrl",
    "nativeToken",
    "status",
    "createdAt",
    "lastUpdated",
    "l1Contracts",
    "l2Contracts",
    "bridges",
    "explorers",
    "sequencer",
    "staking",
    "networkConfig",
    "metadata"
  ],
  "properties": {
    "l1ChainId": { "type": "integer", "minimum": 1 },
    "l2ChainId": { "type": "integer", "minimum": 1 },
    "name": { "type": "string", "minLength": 1, "maxLength": 100 },
    "description": { "type": "string", "minLength": 1, "maxLength": 500 },
    "logo": { "type": "string" },
    "website": { "type": "string" },
    "rollupType": { "enum": ["optimistic", "zk", "sovereign"] },
    "stack": { "$ref": "#/definitions/Stack" },
    "rpcUrl": { "type": "string" },
    "wsUrl": { "type": "string" },
    "nativeToken": { "$ref": "#/definitions/NativeToken" },
    "status": { "enum": ["active", "inactive", "maintenance", "deprecated", "shutdown"] },
    "createdAt": { "type": "string", "format": "date-time" },
    "lastUpdated": { "type": "string", "format": "date-time" },
    "shutdown": { "$ref": "#/definitions/Shutdown" },
    "l1Contracts": { "$ref": "#/definitions/L1Contracts" },
    "l2Contracts": { "$ref": "#/definitions/L2Contracts" },
    "bridges": { "type": "array", "items": { "$ref": "#/definitions/Bridge" } },
    "explorers": { "type": "array", "items": { "$ref": "#/definitions/Explorer" } },
    "supportResources": { "$ref": "#/definitions/SupportResources" },
    "sequencer": { "$ref": "#/definitions/Sequencer" },
    "staking": { "$ref": "#/definitions/Staking" },
    "networkConfig": { "$ref": "#/definitions/NetworkConfig" },
    "withdrawalConfig": { "$ref": "#/definitions/WithdrawalConfig" },
    "metadata": { "$ref": "#/definitions/Metadata" }
  }
}
```

## 🔧 Required Fields

### Basic Information

#### l1ChainId
- **Type**: `integer`
- **Required**: Yes
- **Validation**: Must be positive integer (1: mainnet, 11155111: sepolia)
- **Description**: L1 network chain ID where SystemConfig is deployed

```json
{
  "l1ChainId": 1
}
```

#### l2ChainId
- **Type**: `integer`
- **Required**: Yes
- **Validation**: Must be positive integer, unique across all rollups
- **Description**: L2 network's own chain identifier

```json
{
  "l2ChainId": 12345
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
- **Values**: `"optimistic"`, `"zk"`, `"sovereign"`
- **Description**: Type of rollup technology used

```json
{
  "rollupType": "optimistic"
}
```

#### status
- **Type**: `enum`
- **Required**: Yes
- **Values**: `"active"`, `"inactive"`, `"maintenance"`, `"deprecated"`, `"shutdown"`
- **Description**: Current operational status

```json
{
  "status": "active"
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
- **Description**: Primary RPC endpoint for the L2 network

```json
{
  "rpcUrl": "https://rpc.my-l2.com"
}
```

#### wsUrl
- **Type**: `string`
- **Required**: No
- **Description**: WebSocket endpoint for real-time data

```json
{
  "wsUrl": "wss://ws.my-l2.com"
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

**Required Properties:**
- `systemConfig`: Core SystemConfig contract (used as filename identifier)

**Optional Properties:**
- `l1StandardBridge`, `optimismPortal`, `l2OutputOracle`: Optimistic rollup contracts
- `disputeGameFactory`, `l1CrossDomainMessenger`, `l1ERC721Bridge`: Bridge contracts
- `addressManager`: Legacy address manager

### L2 Contracts

#### l2Contracts
- **Type**: `object`
- **Required**: Yes
- **Description**: All deployed L2 contract addresses

```json
{
  "l2Contracts": {
    "nativeToken": "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead",
    "l2CrossDomainMessenger": "0x4200000000000000000000000000000000000007",
    "l2StandardBridge": "0x4200000000000000000000000000000000000010",
    "l1Block": "0x4200000000000000000000000000000000000015",
    "l2ToL1MessagePasser": "0x4200000000000000000000000000000000000016",
    "gasPriceOracle": "0x420000000000000000000000000000000000000f"
  }
}
```

**Required Properties:**
- `nativeToken`: L2 native token contract address

**Optional Properties:**
- `l2CrossDomainMessenger`, `l2StandardBridge`: L2 bridge contracts
- `l1Block`, `l2ToL1MessagePasser`: L2 system contracts
- `gasPriceOracle`: Gas price management contract
- `wrappedETH`: ETH wrapped as ERC20 (when native token is ERC20)

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

### Explorers

#### explorers
- **Type**: `array`
- **Required**: Yes
- **Description**: Block explorer information array

```json
{
  "explorers": [
    {
      "name": "My L2 Explorer",
      "url": "https://explorer.my-l2.com",
      "type": "blockscout",
      "status": "active",
      "apiUrl": "https://api.explorer.my-l2.com"
    }
  ]
}
```

**Explorer Types:**
- `"blockscout"`: Blockscout explorer
- `"etherscan"`: Etherscan-compatible
- `"custom"`: Custom explorer implementation

### Bridges

#### bridges
- **Type**: `array`
- **Required**: Yes
- **Description**: Supported bridge protocols

```json
{
  "bridges": [
    {
      "name": "Native Bridge",
      "type": "native",
      "url": "https://bridge.my-l2.com",
      "status": "active",
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
- **Required**: Yes
- **Description**: Ton Staking V2 candidate status and registration information

```json
{
  "staking": {
    "isCandidate": true,
    "candidateRegisteredAt": "2024-12-01T00:00:00Z",
    "candidateStatus": "active",
    "registrationTxHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "candidateAddress": "0x9876543210987654321098765432109876543210",
    "rollupConfigAddress": "0x1234567890123456789012345678901234567890",
    "stakingServiceName": "My Awesome L2 Candidate"
  }
}
```

**Required Properties:**
- `isCandidate`: Whether registered as candidate in Staking V2

**Optional Properties:**
- `candidateRegisteredAt`: Candidate registration time (ISO 8601 format)
- `candidateStatus`: Current status (`"not_registered"`, `"pending"`, `"active"`, `"suspended"`, `"terminated"`)
- `registrationTxHash`: Transaction hash where SystemConfig was registered
- `candidateAddress`: Generated candidate address after registration
- `rollupConfigAddress`: Same as systemConfig address (alias for compatibility)
- `stakingServiceName`: Name displayed in staking UI

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
- **Required**: Yes
- **Description**: Network operation parameters

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

**Parameters:**
- `blockTime`: L2 block time in seconds
- `gasLimit`: Block gas limit
- `batchSubmissionFrequency`: Batch submission interval (seconds)
- `outputRootFrequency`: Output root proposal interval (seconds)

## 🔐 Metadata Signature

### metadata
- **Type**: `object`
- **Required**: Yes
- **Description**: Cryptographic proof of sequencer authority

```json
{
  "metadata": {
    "version": "1.0.0",
    "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "signedBy": "0x1234567890123456789012345678901234567890"
  }
}
```

**Required Properties:**
- `version`: Metadata schema version string
- `signature`: Ethereum signature (130 characters including 0x prefix)
- `signedBy`: Address of the sequencer who signed (must match sequencer.address)

> 📖 **For signature details**: See [Registration Guide](registration-guide.md#signature-generation)

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
  "l1ChainId": 11155111,
  "l2ChainId": 12345,
  "name": "My Awesome L2",
  "description": "An innovative L2 solution built with Tokamak SDK",
  "logo": "https://assets.my-l2.com/logo.png",
  "website": "https://my-l2.com",
  "rollupType": "optimistic",
  "stack": {
    "name": "thanos",
    "version": "1.0.0",
    "commit": "abc123def456",
    "documentation": "https://docs.tokamak.network/thanos"
  },
  "rpcUrl": "https://rpc.my-l2.com",
  "wsUrl": "wss://ws.my-l2.com",
  "nativeToken": {
    "type": "eth",
    "symbol": "ETH",
    "name": "Ethereum",
    "decimals": 18,
    "logoUrl": "https://assets.my-l2.com/eth-logo.png"
  },
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z",
  "lastUpdated": "2025-01-01T12:00:00Z",
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
  "l2Contracts": {
    "nativeToken": "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead",
    "l2CrossDomainMessenger": "0x4200000000000000000000000000000000000007",
    "l2StandardBridge": "0x4200000000000000000000000000000000000010",
    "l1Block": "0x4200000000000000000000000000000000000015",
    "l2ToL1MessagePasser": "0x4200000000000000000000000000000000000016",
    "gasPriceOracle": "0x420000000000000000000000000000000000000f"
  },
  "bridges": [
    {
      "name": "Native Bridge",
      "type": "native",
      "url": "https://bridge.my-l2.com",
      "status": "active",
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
  "explorers": [
    {
      "name": "My L2 Explorer",
      "url": "https://explorer.my-l2.com",
      "type": "blockscout",
      "status": "active",
      "apiUrl": "https://api.explorer.my-l2.com"
    }
  ],
  "supportResources": {
    "statusPageUrl": "https://status.my-l2.com",
    "supportContactUrl": "https://support.my-l2.com",
    "documentationUrl": "https://docs.my-l2.com",
    "communityUrl": "https://discord.gg/my-l2",
    "helpCenterUrl": "https://help.my-l2.com",
    "announcementUrl": "https://twitter.com/my-l2"
  },
  "sequencer": {
    "address": "0x1234567890123456789012345678901234567890",
    "batcherAddress": "0x2345678901234567890123456789012345678901",
    "proposerAddress": "0x3456789012345678901234567890123456789012"
  },
  "staking": {
    "isCandidate": true,
    "candidateRegisteredAt": "2024-12-01T00:00:00Z",
    "candidateStatus": "active",
    "registrationTxHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "candidateAddress": "0x9876543210987654321098765432109876543210",
    "rollupConfigAddress": "0x1234567890123456789012345678901234567890",
    "stakingServiceName": "My Awesome L2 Candidate"
  },
  "networkConfig": {
    "blockTime": 2,
    "gasLimit": "30000000",
    "batchSubmissionFrequency": 1440,
    "outputRootFrequency": 240
  },
  "withdrawalConfig": {
    "challengePeriod": 120,
    "expectedWithdrawalDelay": 1560,
    "monitoringInfo": {
      "l2OutputOracleAddress": "0x4567890123456789012345678901234567890123",
      "outputProposedEventTopic": "0x4ee37ac2c786ec85e87592d3c5c8a1dd66f8496dda3f125d9ea8ca5f657629b6"
    }
  },
  "metadata": {
    "version": "1.0.0",
    "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "signedBy": "0x1234567890123456789012345678901234567890"
  }
}
```

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - How to create and submit metadata
- [Validation System](validation-system.md) - Automated validation rules
- [File Naming](file-naming.md) - Naming conventions and directory structure
- [Withdrawal Monitoring](withdrawal-monitoring.md) - withdrawalConfig implementation

### Support Resources

#### supportResources
- **Type**: `object`
- **Required**: No
- **Description**: L2 support resources and contact information

```json
{
  "supportResources": {
    "statusPageUrl": "https://status.my-l2.com",
    "supportContactUrl": "https://support.my-l2.com",
    "documentationUrl": "https://docs.my-l2.com",
    "communityUrl": "https://discord.gg/my-l2",
    "helpCenterUrl": "https://help.my-l2.com",
    "announcementUrl": "https://twitter.com/my-l2"
  }
}
```

**All Properties Optional:**
- `statusPageUrl`: Rollup status monitoring page
- `supportContactUrl`: Support contact (Discord, Telegram, etc.)
- `documentationUrl`: Official technical documentation
- `communityUrl`: Community chat or forum
- `helpCenterUrl`: Help center or FAQ page
- `announcementUrl`: Official announcements channel