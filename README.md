# Tokamak Rollup Metadata Repository

A centralized repository for managing metadata of L2 rollups deployed through the Tokamak Rollup SDK.

## 📋 Overview

This repository manages information for L2 rollups deployed in the Tokamak Network ecosystem. It provides detailed information for candidates registered in Staking V2 and offers a secure and transparent metadata management system through GitHub Pull Requests.

## 🔑 Key Features

- **Sequencer-based Authorization**: Only L2 sequencers can register/modify their rollup information
- **Pull Request Management**: Transparent and verifiable metadata management through PRs
- **Automated Validation System**: Schema, signature, and authorization validation through GitHub Actions
- **Third-party Reference**: Provides candidate registration status and L2 detailed information for third-party integration
- **L2 Termination Management**: Impact tracking on staking when rollups are terminated

## 🏗️ Supported Stack Types

| Stack | Identity Contract | Directory | Rollup Types |
|-------|------------------|-----------|-------------|
| **Tokamak Appchain** | OnChainProposer | `tokamak-appchain-data/` | ZK, Optimistic |
| **Thanos** | SystemConfig | `data/` | Optimistic |
| **Private App Channel** | TBD | `tokamak-appchain-data/` | TBD |
| **py-ethclient** | TBD | `tokamak-appchain-data/` | TBD |

## 📚 Documentation Guide

### 🚀 Getting Started
- **[Tokamak Appchain Registration](docs/tokamak-appchain-registration.md)** - Register Tokamak Appchain stack rollups (new)
- **[Thanos Registration Guide](docs/registration-guide.md)** - Register Thanos stack rollups
- **[Metadata Schema](docs/metadata-schema.md)** - Metadata structure and field descriptions
- **[Validation System](docs/validation-system.md)** - Automated validation and security systems

### 🔧 Developer Guide
- **[Development Setup](docs/development-setup.md)** - Local validation and development environment setup
- **[Withdrawal Monitoring](docs/withdrawal-monitoring.md)** - Withdrawal delay monitoring and troubleshooting

### 📋 Reference Documentation
- **[File Naming Convention](docs/file-naming.md)** - SystemConfig address-based file naming rules
- **[PR Process](docs/pr-process.md)** - Pull Request submission procedures
- **[FAQ](docs/faq.md)** - Frequently asked questions

## 🚀 Quick Start

### Tokamak Appchain Stack (new)

```bash
# 1. Create metadata file
#    Path: tokamak-appchain-data/{l1ChainId}/{stackType}/{identityContract}.json
tokamak-appchain-data/11155111/tokamak-appchain/0xabcdef...01.json

# 2. Validate locally
npm install && npm run build
npx ts-node scripts/validate-metadata.ts \
  --pr-title "[Appchain] 11155111/tokamak-appchain/0xabcdef...01 - My Appchain" \
  tokamak-appchain-data/11155111/tokamak-appchain/0xabcdef...01.json

# 3. Submit PR
#    Title: [Appchain] 11155111/tokamak-appchain/0xabcdef...01 - My Appchain
```

> See [Tokamak Appchain Registration Guide](docs/tokamak-appchain-registration.md) for full details.

### Thanos Stack (legacy)

```bash
# 1. Create metadata file
data/sepolia/0x5678901234567890123456789012345678901234.json

# 2. Validate locally
npm run validate data/sepolia/0x5678901234567890123456789012345678901234.json

# 3. Submit PR
#    Title: [Rollup] sepolia - 0x5678...1234 - Example L2
```

## 📋 Directory Structure

```
tokamak-appchain-data/   # Tokamak Appchain stack metadata (new)
  {l1ChainId}/
    {stackType}/
      {identityContract}.json
data/                    # Thanos stack metadata (legacy)
  mainnet/
  sepolia/
docs/                    # Documentation
schemas/                 # JSON schemas and TypeScript types
src/                     # Source utilities
  sign/                  # HTML signers for metadata
  utils/                 # Validation utilities and RPC config
scripts/                 # CLI tools and utilities
tests/                   # Test files
validators/              # Core validation logic
.github/workflows/       # GitHub Actions workflows
```

## 🔍 Validation

Local validation ensures data integrity before submission:

```bash
# Complete validation (recommended)
npm run validate data/sepolia/0x5678901234567890123456789012345678901234.json

# Individual validation steps
npm run validate:schema <file>                # Schema validation only
npm run validate:onchain <file>               # On-chain validation only
npm run validate:signature:register <file>    # Signature validation (register operation)
npm run validate:signature:update <file>      # Signature validation (update operation)
```

**Available Commands:**
- `npm run validate` - Complete validation (all steps)
- `npm run validate:schema` - JSON schema validation
- `npm run validate:onchain` - Contract existence and sequencer verification
- `npm run validate:signature:register` - Cryptographic signature verification for register operations
- `npm run validate:signature:update` - Cryptographic signature verification for update operations

## 🛠️ Development Tools

### Build and Test
```bash
npm run build     # Compile TypeScript
npm run test      # Run test suite
npm run lint      # Check code style
```

## 🤝 Contributing

1. Fork this repository
2. Create a new branch (`git checkout -b feature/new-rollup`)
3. Make your changes and commit (`git commit -am 'Add new rollup metadata'`)
4. Push to the branch (`git push origin feature/new-rollup`)
5. Create a Pull Request

### Contribution Guidelines

- **One rollup per PR**: Submit separate PRs for each rollup
- **Follow naming conventions**: Use SystemConfig address as filename (lowercase)
- **Complete validation**: Ensure all local validations pass before submitting
- **Proper documentation**: Include comprehensive PR descriptions

## 📞 Support

- **Bug Reports**: [GitHub Issues](https://github.com/tokamak-network/tokamak-rollup-metadata-repository/issues)
- **Documentation**: See [docs/](docs/) directory
- **Questions**: Check [FAQ](docs/faq.md) or create a discussion

## 🔗 Related Projects

- [Tokamak Network](https://tokamak.network) - Main project website
- [Thanos Rollup Hub](https://rolluphub.tokamak.network/) - Tokamak Rollup Hub
- [TON Staking V2](https://simple.staking.tokamak.network/home) - Staking platform

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
