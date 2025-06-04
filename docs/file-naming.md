# File Naming Convention

Complete guide to file naming rules and directory structure for Tokamak rollup metadata repository.

## 🎯 Overview

This document defines the strict naming conventions and directory structure used in the repository to ensure consistency, automation compatibility, and easy identification of rollup metadata.

## 📁 Directory Structure

### Network-Based Organization

```
data/
├── mainnet/          # Ethereum mainnet (Chain ID: 1)
├── sepolia/          # Sepolia testnet (Chain ID: 11155111)
├── holesky/          # Holesky testnet (Chain ID: 17000)
├── optimism/         # Optimism mainnet (Chain ID: 10)
├── base/             # Base mainnet (Chain ID: 8453)
├── arbitrum/         # Arbitrum One (Chain ID: 42161)
└── [custom]/         # Custom network directories for rollups
```

### Network Directory Mapping

| Network | Chain ID | Directory Name | Description |
|---------|----------|----------------|-------------|
| Ethereum Mainnet | 1 | `mainnet` | Main Ethereum network |
| Sepolia | 11155111 | `sepolia` | Ethereum testnet |
| Holesky | 17000 | `holesky` | Ethereum testnet |
| Optimism | 10 | `optimism` | Optimism L2 mainnet |
| Base | 8453 | `base` | Coinbase Base L2 |
| Arbitrum One | 42161 | `arbitrum` | Arbitrum L2 mainnet |

### Custom Network Directories

For rollup chain IDs >= 1000, you can create custom directory names:

```
data/
├── my-rollup-testnet/     # Chain ID: 12345
├── awesome-l2/            # Chain ID: 98765
└── custom-network/        # Chain ID: 54321
```

**Rules for custom directories:**
- Use lowercase letters, numbers, and hyphens only
- No spaces or special characters
- Maximum 50 characters
- Must be descriptive and unique

## 📄 File Naming Rules

### Primary Rule: SystemConfig Address

**All metadata files MUST be named using the SystemConfig contract address in lowercase.**

### Format

```
{systemConfig_address}.json
```

### Examples

```bash
# Correct examples
0x1234567890123456789012345678901234567890.json
0xabcdef1234567890abcdef1234567890abcdef12.json
0x5678901234567890123456789012345678901234.json

# Incorrect examples
0X1234567890123456789012345678901234567890.json  # Uppercase X
0x1234567890123456789012345678901234567890.JSON  # Uppercase extension
optimism-portal.json                              # Descriptive name
rollup-123.json                                   # Custom name
```

### Case Sensitivity Rules

**CRITICAL: All addresses must be lowercase**

```bash
✅ Correct:   0x1234567890123456789012345678901234567890.json
❌ Incorrect: 0X1234567890123456789012345678901234567890.json
❌ Incorrect: 0x1234567890123456789012345678901234567890.JSON
❌ Incorrect: 0x1234567890123456789012345678901234567890.Json
```

### Why SystemConfig Address?

1. **Uniqueness**: Each rollup has a unique SystemConfig address
2. **Verification**: Easy to verify against on-chain data
3. **Automation**: Tools can automatically locate files
4. **Consistency**: Eliminates naming conflicts and variations
5. **Integration**: Staking V2 references SystemConfig as "RollupConfig"

## 🔍 Validation Rules

### File Path Validation

The complete file path must follow this structure:

```
data/{network}/{systemConfig_address}.json
```

### Validation Process

1. **Extract SystemConfig address** from metadata
2. **Verify filename** matches SystemConfig address (lowercase)
3. **Check directory** matches network or chain ID
4. **Validate path structure** follows the format

### Examples of Valid Paths

```bash
# Testnet rollup
data/sepolia/0x1234567890123456789012345678901234567890.json

# Mainnet rollup
data/mainnet/0xabcdef1234567890abcdef1234567890abcdef12.json

# Custom network rollup
data/my-awesome-l2/0x5678901234567890123456789012345678901234.json
```

### Examples of Invalid Paths

```bash
# Wrong filename format
data/sepolia/my-rollup.json
data/sepolia/rollup-12345.json

# Case mismatch
data/sepolia/0X1234567890123456789012345678901234567890.json
data/sepolia/0x1234567890123456789012345678901234567890.JSON

# Wrong directory
data/ethereum/0x1234567890123456789012345678901234567890.json  # Should be 'mainnet'
data/test/0x1234567890123456789012345678901234567890.json      # Should be 'sepolia' or 'holesky'

# Incorrect path structure
metadata/sepolia/0x1234567890123456789012345678901234567890.json  # Should start with 'data/'
data/sepolia/contracts/0x1234567890123456789012345678901234567890.json  # Extra directory
```

## 🔄 Migration and Consistency

### Filename Consistency Check

All three elements must match:

1. **Filename**: `0x1234567890123456789012345678901234567890.json`
2. **Metadata Field**: `l1Contracts.systemConfig: "0x1234567890123456789012345678901234567890"`
3. **PR Title**: `[Rollup] sepolia - 0x1234567890123456789012345678901234567890 - My L2`

### Automatic Validation

```javascript
// Validation logic
function validateFileNaming(filePath, metadata, prTitle) {
  const pathParts = filePath.split('/');
  const filename = pathParts[pathParts.length - 1];
  const network = pathParts[pathParts.length - 2];

  // Extract address from filename
  const filenameAddress = filename.replace('.json', '');

  // Get SystemConfig from metadata
  const systemConfigAddress = metadata.l1Contracts.systemConfig;

  // Extract address from PR title
  const prTitleMatch = prTitle.match(/0x[a-f0-9]{40}/);
  const prTitleAddress = prTitleMatch ? prTitleMatch[0] : null;

  // All must match and be lowercase
  if (
    filenameAddress !== systemConfigAddress.toLowerCase() ||
    filenameAddress !== prTitleAddress?.toLowerCase() ||
    systemConfigAddress !== systemConfigAddress.toLowerCase()
  ) {
    throw new Error('SystemConfig address mismatch between filename, metadata, and PR title');
  }
}
```

## 📋 Network Detection Logic

### Automatic Network Detection

```javascript
function detectNetworkFromChainId(chainId) {
  const networkMappings = {
    1: 'mainnet',
    11155111: 'sepolia',
    17000: 'holesky',
    10: 'optimism',
    8453: 'base',
    42161: 'arbitrum'
  };

  // For known networks
  if (networkMappings[chainId]) {
    return networkMappings[chainId];
  }

  // For custom rollups (chain ID >= 1000)
  if (chainId >= 1000) {
    return 'custom'; // Requires manual directory creation
  }

  throw new Error(`Unknown chain ID: ${chainId}`);
}
```

### Directory Validation

```javascript
function validateDirectoryForChainId(directory, chainId) {
  const knownNetworks = {
    'mainnet': [1],
    'sepolia': [11155111],
    'holesky': [17000],
    'optimism': [10],
    'base': [8453],
    'arbitrum': [42161]
  };

  // Check if directory matches known network
  if (knownNetworks[directory]) {
    if (!knownNetworks[directory].includes(chainId)) {
      throw new Error(
        `Chain ID ${chainId} does not belong to network ${directory}`
      );
    }
    return true;
  }

  // For custom directories, allow rollup chain IDs
  if (chainId >= 1000) {
    return true;
  }

  throw new Error(`Invalid directory ${directory} for chain ID ${chainId}`);
}
```

## 🛠️ Tools and Automation

### File Creation Tool

```bash
# Interactive file creator
npm run create:metadata

# Automatically generates correct filename:
# Input: SystemConfig = 0x1234567890123456789012345678901234567890
# Output: data/sepolia/0x1234567890123456789012345678901234567890.json
```

### Validation Tool

```bash
# Validate file naming
npm run validate:filename data/sepolia/0x1234567890123456789012345678901234567890.json

# Validate entire directory
npm run validate:directory data/sepolia/

# Check for naming inconsistencies
npm run check:naming-consistency
```

### Bulk Rename Tool

```bash
# Rename files to follow naming convention (if needed)
npm run rename:to-systemconfig data/sepolia/*.json

# Dry run (preview changes)
npm run rename:to-systemconfig -- --dry-run data/sepolia/*.json
```

## 📖 Examples

### Complete Example Walkthrough

1. **Rollup Information**:
   - Chain ID: 12345
   - SystemConfig: `0x1234567890123456789012345678901234567890`
   - Network: Sepolia testnet
   - Name: "My Awesome L2"

2. **Correct File Placement**:
   ```
   data/sepolia/0x1234567890123456789012345678901234567890.json
   ```

3. **Metadata Content** (excerpt):
   ```json
   {
     "chainId": 12345,
     "name": "My Awesome L2",
     "l1Contracts": {
       "systemConfig": "0x1234567890123456789012345678901234567890"
     }
   }
   ```

4. **PR Title**:
   ```
   [Rollup] sepolia - 0x1234567890123456789012345678901234567890 - My Awesome L2
   ```

### Multiple Rollups Example

```
data/
├── sepolia/
│   ├── 0x1234567890123456789012345678901234567890.json
│   ├── 0xabcdef1234567890abcdef1234567890abcdef12.json
│   └── 0x5678901234567890123456789012345678901234.json
├── mainnet/
│   ├── 0x9876543210987654321098765432109876543210.json
│   └── 0xfedcba0987654321fedcba0987654321fedcba09.json
└── my-custom-l2/
    └── 0x1111111111111111111111111111111111111111.json
```

## 🚨 Common Mistakes

### 1. Case Sensitivity Issues

```bash
❌ 0X1234567890123456789012345678901234567890.json  # Uppercase 0X
❌ 0x1234567890123456789012345678901234567890.JSON  # Uppercase extension
❌ 0x1234567890123456789012345678901234567890.Json  # Mixed case extension
```

### 2. Wrong Address Usage

```bash
❌ l1-standard-bridge-address.json  # Using wrong contract address
❌ sequencer-address.json          # Using sequencer address
❌ optimism-portal-address.json    # Using OptimismPortal address
```

### 3. Descriptive Names

```bash
❌ my-awesome-rollup.json          # Descriptive name
❌ rollup-12345.json              # Chain ID based name
❌ tokamak-l2.json                # Project name
```

### 4. Directory Misplacement

```bash
❌ data/ethereum/0x1234...json     # Should be 'mainnet'
❌ data/testnet/0x1234...json      # Should be 'sepolia' or 'holesky'
❌ data/l2/0x1234...json          # Should be specific network
```

## 🔧 Integration with Staking V2

### RollupConfig Reference

In Ton Staking V2, the SystemConfig address is referenced as "RollupConfig":

```solidity
// Staking V2 contract
mapping(address => RollupInfo) public rollups;

// Where address is the SystemConfig address
rollups[0x1234567890123456789012345678901234567890]
```

This reinforces why SystemConfig address is used for file naming - it's the primary identifier across all systems.

### Verification Process

1. User stakes on RollupConfig (SystemConfig) address
2. System looks up metadata using same address as filename
3. Automatic verification ensures consistency

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - How to create properly named files
- [Validation System](validation-system.md) - Automated validation of naming rules
- [Metadata Schema](metadata-schema.md) - SystemConfig field requirements
- [Development Setup](development-setup.md) - Tools for file creation and validation