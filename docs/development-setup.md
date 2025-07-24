# Development Setup

Complete guide for setting up local development environment for the Tokamak rollup metadata repository.

## 🎯 Overview

This guide helps developers set up their local environment for contributing to the rollup metadata repository.

## 📋 Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: v2.30.0 or higher

```bash
# Check versions
node --version    # Should be >= 18.0.0
npm --version     # Should be >= 8.0.0
git --version     # Should be >= 2.30.0
```

## 🚀 Setup

```bash
# Clone the repository
git clone https://github.com/tokamak-network/tokamak-rollup-metadata-repository.git
cd tokamak-rollup-metadata-repository

# Install dependencies
npm install

# Test validation (works immediately!)
npm run validate -- data/sepolia/0x1234567890123456789012345678901234567890.json
```

> 💡 **Ready to go!** No environment setup required - validation works with public RPCs

## 🛠️ Available Commands

### Validation Commands

```bash
# Complete validation (integrated)
npm run validate -- <file>
npm run validate -- data/sepolia/0x1234567890123456789012345678901234567890.json

# Complete validation with PR title (for GitHub Actions)
npm run validate -- --pr-title "[Rollup] sepolia - 12345 - Example L2" <file>

# Direct validation with ts-node (recommended for development)
npx ts-node scripts/validate-metadata.ts --pr-title "[Operation] network systemConfig_address - RollupName" data/network/systemConfig_address.json

# Example for new rollup
npx ts-node scripts/validate-metadata.ts --pr-title "[Rollup] sepolia 0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9 - Poseidon" data/sepolia/0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9.json

# Example for update
npx ts-node scripts/validate-metadata.ts --pr-title "[Update] sepolia 0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9 - Poseidon" data/sepolia/0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9.json

# Important: The signer address must match the onchain sequencer address from the SystemConfig contract

# Individual validation commands (for development/testing)
npm run validate:schema <file>
npm run validate:onchain <file>
npm run validate:signature:register <file>
npm run validate:signature:update <file>
```

### Testing

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Build TypeScript
npm run build
```

### Example Usage

```bash
# Validate a specific file
npm run validate -- data/sepolia/0x1234567890123456789012345678901234567890.json

# Validate another existing file
npm run validate -- data/sepolia/0xbca49844a2982c5e87cb3f813a4f4e94e46d44f9.json
```

## 📁 Project Structure

```
tokamak-rollup-metadata-repository/
├── data/                       # Metadata files
│   └── sepolia/               # Sepolia testnet metadata
├── docs/                       # Documentation
├── schemas/                    # JSON schemas
├── src/                        # Source utilities
│   ├── sign/                   # HTML signature tool
│   └── utils/                  # Validation utilities
├── scripts/                    # Validation scripts
├── tests/                      # Test files
├── validators/                 # Core validation logic
└── README.md
```

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - How to register new rollups
- [Validation System](validation-system.md) - Understanding validation rules
- [Metadata Schema](metadata-schema.md) - Complete schema specification
