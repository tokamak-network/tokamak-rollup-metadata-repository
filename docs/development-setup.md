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
npm run validate data/sepolia/0x5678901234567890123456789012345678901234.json
```

> 💡 **Ready to go!** No environment setup required - validation works with public RPCs

## 🛠️ Available Commands

### Validation Commands

```bash
# Complete validation
npm run validate <file>

# Individual validation steps
npm run validate:schema <file>       # Schema validation only
npm run validate:onchain <file>      # On-chain validation only
npm run validate:signature <file>    # Signature validation only
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Example Usage

```bash
# Validate a specific file
npm run validate data/sepolia/0x1234567890123456789012345678901234567890.json

# Validate all files in a directory
npm run validate data/sepolia/*.json
```

## 📁 Project Structure

```
tokamak-rollup-metadata-repository/
├── data/                       # Metadata files
│   ├── mainnet/
│   └── sepolia/
├── docs/                       # Documentation
├── schemas/                    # JSON schemas
├── src/                        # Source utilities
│   ├── sign/                   # HTML signature tool
│   └── utils/                  # Validation utilities
├── tests/                      # Test files
├── validators/                 # Core validation logic
└── README.md
```

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - How to register new rollups
- [Validation System](validation-system.md) - Understanding validation rules
- [Metadata Schema](metadata-schema.md) - Complete schema specification