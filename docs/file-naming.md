# File Naming Convention

Complete guide to file naming rules and directory structure for Tokamak rollup metadata repository.

## 🎯 Overview

This document defines the strict naming conventions and directory structure used in the repository to ensure consistency, automation compatibility, and easy identification of rollup metadata.

## 📁 Directory Structure

### Network-Based Organization

```
data/
├── mainnet/          # Ethereum mainnet (Chain ID: 1)
└── sepolia/          # Sepolia testnet (Chain ID: 11155111)
```

### Network Directory Mapping

| Network | Chain ID | Directory Name | Description |
|---------|----------|----------------|-------------|
| Ethereum Mainnet | 1 | `mainnet` | Main Ethereum network |
| Sepolia | 11155111 | `sepolia` | Ethereum testnet |

**Note**: Only these two L1 networks are currently supported. Custom L1 networks are not supported.

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

### File Path Structure

The complete file path must follow this structure:

```
data/{network}/{systemConfig_address}.json
```

### Validation Process

1. **Extract SystemConfig address** from metadata
2. **Verify filename** matches SystemConfig address (lowercase)
3. **Check directory** matches network or chain ID
4. **Validate path structure** follows the format

### Path Examples

**Valid paths:**
```bash
data/sepolia/0x1234567890123456789012345678901234567890.json
data/mainnet/0xabcdef1234567890abcdef1234567890abcdef12.json
```

**Invalid paths:**
```bash
data/sepolia/my-rollup.json                                    # Wrong filename format
data/sepolia/0X1234567890123456789012345678901234567890.json   # Case mismatch
data/ethereum/0x1234567890123456789012345678901234567890.json  # Should be 'mainnet'
metadata/sepolia/0x1234567890123456789012345678901234567890.json  # Wrong base directory
```

## 🔄 Migration and Consistency

### Filename Consistency Check

All three elements must match:

1. **Filename**: `0x1234567890123456789012345678901234567890.json`
2. **Metadata Field**: `l1Contracts.systemConfig: "0x1234567890123456789012345678901234567890"`
3. **PR Title**: `[Rollup] sepolia - 0x1234567890123456789012345678901234567890 - My L2`

> 📖 **For validation details**: See [Validation System](validation-system.md)

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
❌ data/testnet/0x1234...json      # Should be 'sepolia'
❌ data/l2/0x1234...json          # Should be specific network
```

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - How to create properly named files
- [Validation System](validation-system.md) - Automated validation of naming rules
- [Metadata Schema](metadata-schema.md) - SystemConfig field requirements
- [PR Process](pr-process.md) - Pull request title format requirements