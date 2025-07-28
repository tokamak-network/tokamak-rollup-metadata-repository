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
    "documentation": "https://docs.tokamak.network/thanos",
    "zkProofSystem": "plonk"
  }
}
```

**Properties:**
- `name`: Stack name (`"thanos"`, `"op-stack"`, etc.)
- `version`: Semantic version string
- `commit`: Git commit hash (optional)
- `documentation`: Link to stack documentation (optional)
- `zkProofSystem`: ZK proof system type (`"plonk"`, `"stark"`, `"groth16"`, `"fflonk"`) - for future ZK rollups

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
    "l1Address": "0x0000000000000000000000000000000000000000",
    "logoUrl": "https://assets.my-l2.com/eth-logo.png",
    "coingeckoId": "ethereum"
  }
}
```

**Native Token Properties:**
- `type`: Token type (`"eth"` or `"erc20"`)
- `symbol`: Token symbol (ETH, TON, USDC)
- `name`: Full token name
- `decimals`: Decimal places (usually 18 for ETH, 6 for USDC)
- `l1Address`: L1 contract address (required for ERC20 type)
- `logoUrl`: Token logo URL (optional)
- `coingeckoId`: CoinGecko ID for price data (optional)

## 🏗️ Contract Information

### L1 Contracts

#### l1Contracts
- **Type**: `object`
- **Required**: Yes
- **Description**: L1 contract addresses. For Thanos optimistic rollups (`rollupType: "optimistic"` AND `stack.name: "thanos"`), all contracts must be included. For other rollup types, only include deployed contracts.

```json
{
  "l1Contracts": {
    "SystemConfig": "0x1234567890123456789012345678901234567890",
    "ProxyAdmin": "0x1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c",
    "AddressManager": "0x1111111111111111111111111111111111111111",
    "SuperchainConfig": "0x1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f",
    "DisputeGameFactory": "0x6666666666666666666666666666666666666666",
    "L1CrossDomainMessenger": "0x8888888888888888888888888888888888888888",
    "L1ERC721Bridge": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "L1StandardBridge": "0xcccccccccccccccccccccccccccccccccccccccc",
    "OptimismMintableERC20Factory": "0x1313131313131313131313131313131313131313",
    "OptimismPortal": "0x1515151515151515151515151515151515151515",
    "AnchorStateRegistry": "0x2222222222222222222222222222222222222222",
    "DelayedWETH": "0x4444444444444444444444444444444444444444",
    "L1UsdcBridge": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "L2OutputOracle": "0x1010101010101010101010101010101010101010",
    "Mips": "0x1212121212121212121212121212121212121212",
    "PermissionedDelayedWETH": "0x1818181818181818181818181818181818181818",
    "PreimageOracle": "0x1919191919191919191919191919191919191919",
    "ProtocolVersions": "0x1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a",
    "SafeProxyFactory": "0x1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d",
    "SafeSingleton": "0x1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e",
    "SystemOwnerSafe": "0x2121212121212121212121212121212121212121"
  }
}
```

**Required Properties:**
- `SystemConfig`: Core SystemConfig contract (used as filename identifier)

**Required Properties (when rollupType is "optimistic" AND stack.name is "thanos"):**
- `SystemConfig`: Core SystemConfig contract (used as filename identifier)
- `ProxyAdmin`: Proxy admin contract
- `AddressManager`: Address manager contract
- `SuperchainConfig`: Superchain configuration contract
- `DisputeGameFactory`: Dispute game factory contract
- `L1CrossDomainMessenger`: L1 cross-domain messenger contract
- `L1ERC721Bridge`: L1 ERC721 bridge contract
- `L1StandardBridge`: L1 standard bridge contract
- `OptimismMintableERC20Factory`: Optimism mintable ERC20 factory contract
- `OptimismPortal`: Optimism portal contract
- `AnchorStateRegistry`: Anchor state registry contract
- `DelayedWETH`: Delayed WETH contract
- `L1UsdcBridge`: L1 USDC bridge contract
- `L2OutputOracle`: L2 output oracle contract
- `Mips`: MIPS contract
- `PermissionedDelayedWETH`: Permissioned delayed WETH contract
- `PreimageOracle`: Preimage oracle contract
- `ProtocolVersions`: Protocol versions contract
- `SafeProxyFactory`: Safe proxy factory contract
- `SafeSingleton`: Safe singleton contract
- `SystemOwnerSafe`: System owner safe contract

**Optional Properties (for other rollup types or stacks):**
- `l1StandardBridge`, `optimismPortal`, `l2OutputOracle`: Optimistic rollup contracts
- `disputeGameFactory`, `l1CrossDomainMessenger`, `l1ERC721Bridge`: Bridge contracts
- `addressManager`: Legacy address manager
- `optimismMintableERC20Factory`, `optimismMintableERC721Factory`: Token factory contracts
- `superchainConfig`: Superchain configuration contract
- `l1UsdcBridge`, `l1Usdc`: USDC bridge contracts
- `zkVerifier`, `rollupProcessor`, `exitRoot`: ZK rollup contracts (future use)
- `globalExitRootManager`, `polygonDataCommittee`: Polygon-style contracts (future use)
- `rollupManager`, `proxyAdmin`: Common rollup contracts

### L2 Contracts

#### l2Contracts
- **Type**: `object`
- **Required**: Yes
- **Description**: L2 contract addresses. For Thanos optimistic rollups (`rollupType: "optimistic"` AND `stack.name: "thanos"`), all contracts must be included. For other rollup types, only include deployed contracts.

```json
{
  "l2Contracts": {
    "NativeToken": "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
    "WETH": "0x4200000000000000000000000000000000000006",
    "L2ToL1MessagePasser": "0x4200000000000000000000000000000000000016",
    "DeployerWhitelist": "0x4200000000000000000000000000000000000002",
    "L2CrossDomainMessenger": "0x4200000000000000000000000000000000000007",
    "GasPriceOracle": "0x420000000000000000000000000000000000000F",
    "L2StandardBridge": "0x4200000000000000000000000000000000000010",
    "SequencerFeeVault": "0x4200000000000000000000000000000000000011",
    "OptimismMintableERC20Factory": "0x4200000000000000000000000000000000000012",
    "L1BlockNumber": "0x4200000000000000000000000000000000000013",
    "L1Block": "0x4200000000000000000000000000000000000015",
    "GovernanceToken": "0x4200000000000000000000000000000000000042",
    "LegacyMessagePasser": "0x4200000000000000000000000000000000000000",
    "L2ERC721Bridge": "0x4200000000000000000000000000000000000014",
    "OptimismMintableERC721Factory": "0x4200000000000000000000000000000000000017",
    "ProxyAdmin": "0x4200000000000000000000000000000000000018",
    "BaseFeeVault": "0x4200000000000000000000000000000000000019",
    "L1FeeVault": "0x420000000000000000000000000000000000001a",
    "ETH": "0x4200000000000000000000000000000000000486"
  }
}
```

**Required Properties (when rollupType is "optimistic" AND stack.name is "thanos"):**
- `NativeToken`: L2 native token contract address
- `WETH`: WETH contract
- `L2ToL1MessagePasser`: L2 to L1 message passer contract
- `DeployerWhitelist`: Deployer whitelist contract
- `L2CrossDomainMessenger`: L2 cross-domain messenger contract
- `GasPriceOracle`: Gas price oracle contract
- `L2StandardBridge`: L2 standard bridge contract
- `SequencerFeeVault`: Sequencer fee vault contract
- `OptimismMintableERC20Factory`: Optimism mintable ERC20 factory contract
- `L1BlockNumber`: L1 block number contract
- `L1Block`: L1 block contract
- `GovernanceToken`: Governance token contract
- `LegacyMessagePasser`: Legacy message passer contract
- `L2ERC721Bridge`: L2 ERC721 bridge contract
- `OptimismMintableERC721Factory`: Optimism mintable ERC721 factory contract
- `ProxyAdmin`: Proxy admin contract
- `BaseFeeVault`: Base fee vault contract
- `L1FeeVault`: L1 fee vault contract
- `ETH`: ETH contract

**Optional Properties (for other rollup types or stacks):**
- `l2CrossDomainMessenger`, `l2StandardBridge`: L2 bridge contracts
- `l1Block`, `l2ToL1MessagePasser`: L2 system contracts
- `gasPriceOracle`: Gas price management contract
- `l2ERC721Bridge`: NFT bridge contract
- `l1FeeVault`, `sequencerFeeVault`, `baseFeeVault`: Fee collection contracts
- `l2UsdcBridge`, `l2Usdc`: USDC bridge contracts
- `wrappedETH`: ETH wrapped as ERC20 address (when native token is ERC20)
- `polygonZkEVMBridge`, `polygonZkEVMGlobalExitRoot`: ZK rollup contracts (future use)
- `multicall`, `create2Deployer`: Common utility contracts

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
    "proposerAddress": "0x3456789012345678901234567890123456789012",
    "aggregatorAddress": "0x4567890123456789012345678901234567890123",
    "trustedSequencer": "0x5678901234567890123456789012345678901234"
  }
}
```

**Sequencer Properties:**
- `address`: Current sequencer address (must match SystemConfig.unsafeBlockSigner())
- `batcherAddress`: Address that submits batches to L1 (optional, for optimistic rollups)
- `proposerAddress`: Address that proposes L2 output roots (optional, for optimistic rollups)
- `aggregatorAddress`: Aggregator address (optional, for future ZK rollups)
- `trustedSequencer`: Trusted sequencer address (optional, for future ZK rollups)

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

**Explorer Properties:**
- `name`: Explorer display name
- `url`: Explorer website URL
- `type`: Explorer type
- `status`: Operational status (`"active"`, `"inactive"`, `"maintenance"`, `"none"`)
- `apiUrl`: API endpoint URL (optional)

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
          "isNativeToken": true,
          "isWrappedETH": false
        },
        {
          "symbol": "USDC",
          "l1Address": "0xa0b86a33e6c8b8b7f1b5a4e9ec04d9b8b12c3db4",
          "l2Address": "0xb1c75e89fc0c2e4b8e6d9f3b4a5c7b8f12e4d6c3",
          "decimals": 6,
          "isNativeToken": false,
          "isWrappedETH": false,
          "logoUrl": "https://assets.my-l2.com/usdc-logo.png"
        }
      ]
    }
  ]
}
```

**Bridge Types:**
- `"native"`: Standard Optimism bridge
- `"canonical"`: Canonical bridge protocol
- `"third-party"`: External bridge protocol

**Bridge Properties:**
- `name`: Bridge display name
- `type`: Bridge protocol type (`"native"`, `"canonical"`, `"third-party"`)
- `url`: Bridge interface URL
- `status`: Operational status (`"active"`, `"inactive"`, `"maintenance"`, `"none"`)

**Supported Token Properties:**
- `symbol`: Token symbol (ETH, USDC, etc.)
- `l1Address`: L1 token address (0x0000... for ETH)
- `l2Address`: L2 token address
- `decimals`: Token decimal places
- `isNativeToken`: Whether it's the L2's native token
- `isWrappedETH`: Whether ETH is wrapped as ERC20 token
- `logoUrl`: Token logo URL (optional)

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
    },
    "batchSubmissionFrequency": 1440,
    "outputRootFrequency": 240
  }
}
```

**Time Values (in seconds):**
- `challengePeriod`: 120 (2 minutes)
- `expectedWithdrawalDelay`: 1560 (26 minutes total)
- `batchSubmissionFrequency`: 1440 (24 minutes, batch submission interval)
- `outputRootFrequency`: 240 (4 minutes, output root submission interval)

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
    "baseFeePerGas": "1000000000",
    "priorityFeePerGas": "1000000000",
    "batchTimeout": 3600,
    "trustedAggregatorTimeout": 7200,
    "forceBatchTimeout": 86400
  }
}
```

**Network Configuration Properties:**
- `blockTime`: L2 block time in seconds
- `gasLimit`: Block gas limit
- `baseFeePerGas`: Base fee per gas (optional)
- `priorityFeePerGas`: Priority fee per gas (optional)
- `batchTimeout`: ZK batch timeout in seconds (optional, for future ZK rollups)
- `trustedAggregatorTimeout`: Trusted aggregator timeout in seconds (optional, for future ZK rollups)
- `forceBatchTimeout`: Force batch timeout in seconds (optional, for future ZK rollups)

## 🔐 Metadata Signature

### metadata
- **Type**: `object`
- **Required**: Yes
- **Description**: Cryptographic proof of sequencer authority with temporal validity

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
- `signature`: Ethereum signature (130 characters including 0x prefix) with 24-hour validity
- `signedBy`: Address of the sequencer who signed (must match sequencer.address)

**Security Features:**
- **Temporal validity**: Signatures expire 24 hours after creation
- **Replay protection**: Timestamps prevent signature reuse
- **On-chain verification**: Signer must match SystemConfig.unsafeBlockSigner()

**Message Format:**
```
Tokamak Rollup Registry
L1 Chain ID: {l1ChainId}
L2 Chain ID: {l2ChainId}
Operation: {register|update}
SystemConfig: {systemConfigAddress}
Timestamp: {unixTimestamp}
```

**Validation Rules:**
- **24-hour expiry**: Signatures expire 24 hours after timestamp
- **Future timestamp prevention**: No future timestamps allowed
- **Update constraints**: For updates, lastUpdated must be within 1 hour and sequential
- **Signer verification**: Must match on-chain SystemConfig.unsafeBlockSigner()
- **Timestamp consistency**: Signature timestamp must exactly match metadata time fields
  - Register: signature timestamp = createdAt (use same timestamp value)
  - Update: signature timestamp = lastUpdated (use same timestamp value)

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
    "documentation": "https://docs.tokamak.network/thanos",
    "zkProofSystem": "plonk"
  },
  "rpcUrl": "https://rpc.my-l2.com",
  "wsUrl": "wss://ws.my-l2.com",
  "nativeToken": {
    "type": "eth",
    "symbol": "ETH",
    "name": "Ethereum",
    "decimals": 18,
    "l1Address": "0x0000000000000000000000000000000000000000",
    "logoUrl": "https://assets.my-l2.com/eth-logo.png",
    "coingeckoId": "ethereum"
  },
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z",
  "lastUpdated": "2025-01-01T12:00:00Z",
  "l1Contracts": {
    "SystemConfig": "0x1234567890123456789012345678901234567890",
    "ProxyAdmin": "0x1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c",
    "AddressManager": "0x1111111111111111111111111111111111111111",
    "SuperchainConfig": "0x1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f",
    "DisputeGameFactory": "0x6666666666666666666666666666666666666666",
    "L1CrossDomainMessenger": "0x8888888888888888888888888888888888888888",
    "L1ERC721Bridge": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "L1StandardBridge": "0xcccccccccccccccccccccccccccccccccccccccc",
    "OptimismMintableERC20Factory": "0x1313131313131313131313131313131313131313",
    "OptimismPortal": "0x1515151515151515151515151515151515151515",
    "AnchorStateRegistry": "0x2222222222222222222222222222222222222222",
    "DelayedWETH": "0x4444444444444444444444444444444444444444",
    "L1UsdcBridge": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "L2OutputOracle": "0x1010101010101010101010101010101010101010",
    "Mips": "0x1212121212121212121212121212121212121212",
    "PermissionedDelayedWETH": "0x1818181818181818181818181818181818181818",
    "PreimageOracle": "0x1919191919191919191919191919191919191919",
    "ProtocolVersions": "0x1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a",
    "SafeProxyFactory": "0x1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d",
    "SafeSingleton": "0x1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e",
    "SystemOwnerSafe": "0x2121212121212121212121212121212121212121"
  },
  "l2Contracts": {
    "NativeToken": "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
    "WETH": "0x4200000000000000000000000000000000000006",
    "L2ToL1MessagePasser": "0x4200000000000000000000000000000000000016",
    "DeployerWhitelist": "0x4200000000000000000000000000000000000002",
    "L2CrossDomainMessenger": "0x4200000000000000000000000000000000000007",
    "GasPriceOracle": "0x420000000000000000000000000000000000000F",
    "L2StandardBridge": "0x4200000000000000000000000000000000000010",
    "SequencerFeeVault": "0x4200000000000000000000000000000000000011",
    "OptimismMintableERC20Factory": "0x4200000000000000000000000000000000000012",
    "L1BlockNumber": "0x4200000000000000000000000000000000000013",
    "L1Block": "0x4200000000000000000000000000000000000015",
    "GovernanceToken": "0x4200000000000000000000000000000000000042",
    "LegacyMessagePasser": "0x4200000000000000000000000000000000000000",
    "L2ERC721Bridge": "0x4200000000000000000000000000000000000014",
    "OptimismMintableERC721Factory": "0x4200000000000000000000000000000000000017",
    "ProxyAdmin": "0x4200000000000000000000000000000000000018",
    "BaseFeeVault": "0x4200000000000000000000000000000000000019",
    "L1FeeVault": "0x420000000000000000000000000000000000001a",
    "ETH": "0x4200000000000000000000000000000000000486"
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
          "isNativeToken": true,
          "isWrappedETH": false
        },
        {
          "symbol": "USDC",
          "l1Address": "0xa0b86a33e6c8b8b7f1b5a4e9ec04d9b8b12c3db4",
          "l2Address": "0xb1c75e89fc0c2e4b8e6d9f3b4a5c7b8f12e4d6c3",
          "decimals": 6,
          "isNativeToken": false,
          "isWrappedETH": false,
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
    "proposerAddress": "0x3456789012345678901234567890123456789012",
    "aggregatorAddress": "0x4567890123456789012345678901234567890123",
    "trustedSequencer": "0x5678901234567890123456789012345678901234"
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
    "baseFeePerGas": "1000000000",
    "priorityFeePerGas": "1000000000",
    "batchTimeout": 3600,
    "trustedAggregatorTimeout": 7200,
    "forceBatchTimeout": 86400
  },
  "withdrawalConfig": {
    "challengePeriod": 120,
    "expectedWithdrawalDelay": 1560,
    "monitoringInfo": {
      "l2OutputOracleAddress": "0x4567890123456789012345678901234567890123",
      "outputProposedEventTopic": "0x4ee37ac2c786ec85e87592d3c5c8a1dd66f8496dda3f125d9ea8ca5f657629b6"
    },
    "batchSubmissionFrequency": 1440,
    "outputRootFrequency": 240
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