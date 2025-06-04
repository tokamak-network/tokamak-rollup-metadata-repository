# Development Setup

Complete guide for setting up local development environment and validation tools for the Tokamak rollup metadata repository.

## 🎯 Overview

This guide helps developers set up their local environment for contributing to the rollup metadata repository, including validation tools, testing framework, and development utilities.

## 📋 Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: v2.30.0 or higher
- **Operating System**: macOS, Linux, or Windows with WSL2

### Required Tools

```bash
# Check versions
node --version    # Should be >= 18.0.0
npm --version     # Should be >= 8.0.0
git --version     # Should be >= 2.30.0
```

## 🚀 Initial Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/tokamak-network/tokamak-rollup-metadata-repository.git
cd tokamak-rollup-metadata-repository

# Install dependencies
npm install

# Verify installation and test validation (works immediately!)
npm run validate data/sepolia/0x5678901234567890123456789012345678901234.json
```

> 💡 **Ready to go!** No environment setup required - validation works with public RPCs

### 2. Environment Configuration (Optional)

**Only needed for higher rate limits or custom RPC providers:**

```bash
# Create environment file (optional)
echo "MAINNET_RPC_URL=https://your-custom-rpc.com" > .env
echo "SEPOLIA_RPC_URL=https://your-sepolia-rpc.com" >> .env

# Edit with your preferred editor
vim .env
# or
code .env
```

**Required Environment Variables:**

```bash
# .env - Only variables actually used by the validation scripts
# RPC URLs for validation (required)
MAINNET_RPC_URL=https://eth.llamarpc.com
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Alternative public RPC providers (no API key needed)
# MAINNET_RPC_URL=https://ethereum.publicnode.com
# MAINNET_RPC_URL=https://rpc.ankr.com/eth
# SEPOLIA_RPC_URL=https://rpc.sepolia.ethpandaops.io

# Private RPC providers (higher limits, API key required)
# MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
# MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

> **⚠️ Note**: Currently only `MAINNET_RPC_URL` and `SEPOLIA_RPC_URL` are implemented in the validation scripts. Public RPCs work great for development and testing purposes.

### Environment Variables Reference

| Variable | Status | Description | Default |
|----------|--------|-------------|---------|
| `MAINNET_RPC_URL` | 🔧 **Optional** | Custom Ethereum mainnet RPC endpoint | `https://eth.llamarpc.com` |
| `SEPOLIA_RPC_URL` | 🔧 **Optional** | Custom Sepolia testnet RPC endpoint | `https://ethereum-sepolia-rpc.publicnode.com` |

### 3. RPC Provider Setup

#### RPC (Recommended for Development)

**No API key required** - Perfect for getting started quickly:

```bash
# .env - Public RPC endpoints (rate limited but free)
MAINNET_RPC_URL=https://eth.llamarpc.com
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Alternative public RPCs
# MAINNET_RPC_URL=https://ethereum.publicnode.com
# MAINNET_RPC_URL=https://rpc.ankr.com/eth
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/
# SEPOLIA_RPC_URL=https://rpc.sepolia.ethpandaops.io
```

> **✅ Quick Start**: Use public RPCs for immediate testing without signup

## 🛠️ Development Tools

### Package Scripts

```bash
# Validation commands
npm run validate <file>              # Complete validation
npm run validate:schema <file>       # Schema validation only
npm run validate:onchain <file>      # On-chain validation only
npm run validate:signature <file>    # Signature validation only
npm run validate:security <file>     # Security validation only

# Testing commands
npm test                            # Run all tests
npm run test:unit                   # Unit tests only
npm run test:integration            # Integration tests only
npm run test:watch                  # Watch mode for development
npm run test:coverage               # Generate coverage report

# Development utilities
npm run lint                        # Lint code
npm run lint:fix                    # Fix linting issues
npm run format                      # Format code with Prettier
npm run type-check                  # TypeScript type checking

# Metadata utilities
npm run create:metadata             # Interactive metadata creator
npm run generate:example            # Generate example metadata
npm run validate:all                # Validate all existing metadata
npm run check:duplicates            # Check for duplicate chain IDs

# Documentation
npm run docs:build                  # Build documentation
npm run docs:serve                  # Serve documentation locally
```

### CLI Tool Usage

#### Basic Validation

```bash
# Validate single file
npm run validate data/sepolia/0x1234567890123456789012345678901234567890.json

# Validate with PR title check
npm run validate -- --pr-title "[Rollup] sepolia - 0x1234... - My L2" data/sepolia/0x1234*.json

# Validate specific aspects
npm run validate:schema data/sepolia/*.json
npm run validate:onchain data/sepolia/0x1234*.json
npm run validate:signature data/sepolia/0x1234*.json
```

#### Advanced Options

```bash
# Validate with custom RPC
npm run validate -- --rpc-url https://custom-rpc.com data/sepolia/0x1234*.json

# Skip certain validations
npm run validate -- --skip-onchain --skip-security data/sepolia/0x1234*.json

# Verbose output
npm run validate -- --verbose data/sepolia/0x1234*.json

# JSON output for scripting
npm run validate -- --output json data/sepolia/0x1234*.json
```

### Interactive Metadata Creator

```bash
# Start interactive creator
npm run create:metadata

# Example session:
? Select network: sepolia
? SystemConfig address: 0x1234567890123456789012345678901234567890
? Rollup name: My Awesome L2
? Description: An innovative L2 solution
? RPC URL: https://rpc.my-l2.com
? Native token type: eth
... (continues with all required fields)

# Generates file and validates automatically
✅ Created: data/sepolia/0x1234567890123456789012345678901234567890.json
✅ Validation passed!
```

## 🧪 Testing Framework

### Test Structure

```
tests/
├── unit/                   # Unit tests
│   ├── validators/         # Validator tests
│   ├── schemas/           # Schema tests
│   └── utils/             # Utility tests
├── integration/           # Integration tests
│   ├── onchain/          # On-chain validation tests
│   ├── api/              # API tests
│   └── workflows/        # GitHub Actions tests
├── fixtures/              # Test data
│   ├── valid/            # Valid metadata examples
│   ├── invalid/          # Invalid metadata examples
│   └── mocks/            # Mock data
└── helpers/               # Test utilities
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Run tests for specific component
npm test -- --grep "SchemaValidator"
npm test -- --testPathPattern="validators"

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
# Coverage report will be in coverage/ directory
```

### Writing Tests

#### Example Unit Test

```javascript
// tests/unit/validators/schema-validator.test.js
import { SchemaValidator } from '../../../src/validators/schema-validator.js';
import { validMetadata, invalidMetadata } from '../../fixtures/metadata.js';

describe('SchemaValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  describe('validate', () => {
    test('accepts valid metadata', () => {
      expect(() => validator.validate(validMetadata)).not.toThrow();
    });

    test('rejects metadata with missing required fields', () => {
      const incompleteMetadata = { ...validMetadata };
      delete incompleteMetadata.chainId;

      expect(() => validator.validate(incompleteMetadata))
        .toThrow('Missing required field: chainId');
    });

    test('rejects invalid address format', () => {
      const invalidAddressMetadata = {
        ...validMetadata,
        l1Contracts: {
          ...validMetadata.l1Contracts,
          systemConfig: '0xINVALID'
        }
      };

      expect(() => validator.validate(invalidAddressMetadata))
        .toThrow('Invalid address format');
    });
  });
});
```

#### Example Integration Test

```javascript
// tests/integration/onchain/system-config.test.js
import { OnChainValidator } from '../../../src/validators/onchain-validator.js';

describe('OnChainValidator Integration', () => {
  let validator;

  beforeEach(() => {
    validator = new OnChainValidator({
      rpcUrl: process.env.SEPOLIA_RPC_URL,
      timeout: 30000
    });
  });

  test('validates real SystemConfig contract', async () => {
    const systemConfigAddress = '0x034edD2A225f7f429A63E0f1D2084B9E0A93b538';
    const expectedSequencer = '0xfd1D2e729aE8eEe2E146c033bf4400fE75284301';

    await expect(
      validator.validateSystemConfig(systemConfigAddress, expectedSequencer)
    ).resolves.toBe(true);
  }, 30000);

  test('rejects non-existent contract', async () => {
    const fakeAddress = '0x1111111111111111111111111111111111111111';
    const sequencer = '0x2222222222222222222222222222222222222222';

    await expect(
      validator.validateSystemConfig(fakeAddress, sequencer)
    ).rejects.toThrow('Contract not found');
  });
});
```

## 🔍 Debugging and Troubleshooting

### Debug Mode

Enable debug logging for detailed output:

```bash
# Enable debug mode
export ENABLE_DEBUG_LOGS=true
npm run validate data/sepolia/0x1234*.json

# Or set temporarily
ENABLE_DEBUG_LOGS=true npm run validate data/sepolia/0x1234*.json
```

### Common Issues and Solutions

#### 1. RPC Connection Issues

```bash
# Test RPC connectivity
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $SEPOLIA_RPC_URL

# Expected response:
# {"jsonrpc":"2.0","id":1,"result":"0x..."}
```

If connection fails:
- Check RPC URL format in `.env` file
- Verify API key validity
- Try alternative RPC providers (manually change in `.env`)
- Check network connectivity

#### 2. Validation Errors

```bash
# Run validation with detailed output
npm run validate data/sepolia/0x1234567890123456789012345678901234567890.json

# Check specific validation steps
echo "Checking file exists..."
ls -la data/sepolia/0x1234*.json

echo "Checking JSON format..."
cat data/sepolia/0x1234*.json | jq .

echo "Testing RPC connection..."
curl -s $SEPOLIA_RPC_URL -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### 3. Rate Limiting

```bash
# Switch to different RPC provider manually
# Edit .env file:
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Or use environment variable override
SEPOLIA_RPC_URL="https://alternative-rpc.com" npm run validate data/sepolia/*.json
```

#### 4. Memory Issues with Large Datasets

```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 node_modules/.bin/ts-node scripts/validate.ts data/sepolia/*.json

# Validate files one by one instead of bulk validation
for file in data/sepolia/*.json; do
  echo "Validating $file..."
  npm run validate "$file"
done
```

### Basic Logging

Currently logging is handled by console output. For debugging:

```bash
# Redirect output to file
npm run validate data/sepolia/0x1234*.json 2>&1 | tee validation.log

# Check logs
cat validation.log
```

## 🔧 Advanced Configuration

### Custom Validation Rules

Create custom validation rules for your specific needs:

```javascript
// config/custom-validators.js
export const customValidators = {
  // Custom chain ID validation
  validateChainId: (chainId) => {
    if (chainId >= 1000000) {
      throw new Error('Chain ID too large for production use');
    }
  },

  // Custom RPC validation
  validateRpcUrl: async (rpcUrl) => {
    // Test custom RPC requirements
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'net_version',
        params: [],
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`RPC not accessible: ${response.status}`);
    }
  }
};
```

### Git Hooks Setup

Set up pre-commit hooks for automatic validation:

```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run validate:changed"

# Make executable
chmod +x .husky/pre-commit
```

Create validation script for changed files:

```javascript
// scripts/validate-changed.js
#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Get changed JSON files
const changedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
  encoding: 'utf8'
})
  .split('\n')
  .filter(file => file.endsWith('.json') && file.startsWith('data/'))
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log('No metadata files changed');
  process.exit(0);
}

console.log(`Validating ${changedFiles.length} changed files...`);

for (const file of changedFiles) {
  try {
    execSync(`npm run validate ${file}`, { stdio: 'inherit' });
    console.log(`✅ ${file}`);
  } catch (error) {
    console.error(`❌ ${file}`);
    process.exit(1);
  }
}

console.log('All changed files validated successfully!');
```

### IDE Configuration

#### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.json": "jsonc"
  },
  "json.schemas": [
    {
      "fileMatch": ["data/**/*.json"],
      "url": "./schemas/rollup-metadata.json"
    }
  ],
  "eslint.workingDirectories": ["./"],
  "npm.enableScriptExplorer": true
}
```

#### Recommended Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

## 📦 Project Structure

```
tokamak-rollup-metadata-repository/
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       └── validate-metadata.yml
├── .vscode/                    # VS Code configuration
├── config/                     # Configuration files
│   ├── validation.js
│   └── logging.js
├── data/                       # Metadata files
│   ├── mainnet/
│   ├── sepolia/
│   └── holesky/
├── docs/                       # Documentation
├── schemas/                    # JSON schemas
│   └── rollup-metadata.json
├── scripts/                    # Utility scripts
│   ├── validate.js
│   ├── create-metadata.js
│   └── validate-all.js
├── src/                        # Source code
│   ├── validators/
│   ├── utils/
│   └── types/
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example               # Environment template
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

## 🚀 Continuous Integration

### Local CI Simulation

Test your changes with the same validation pipeline used in CI:

```bash
# Run complete CI pipeline locally
npm run ci:validate

# Or run individual CI steps
npm run ci:lint
npm run ci:test
npm run ci:validate:all
npm run ci:security-scan
```

### Performance Testing

```bash
# Benchmark validation performance
npm run benchmark

# Test with large datasets
npm run test:performance

# Memory usage analysis
npm run analyze:memory
```

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - How to register new rollups
- [Validation System](validation-system.md) - Understanding validation rules
- [Metadata Schema](metadata-schema.md) - Complete schema specification
- [File Naming](file-naming.md) - Naming conventions and structure