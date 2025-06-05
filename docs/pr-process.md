# Pull Request Process

Comprehensive guide for submitting pull requests to the Tokamak rollup metadata repository.

## 🎯 Overview

This document outlines the complete process for submitting, reviewing, and merging pull requests for rollup metadata registration or updates, including requirements, validation steps, and best practices.

## 📋 PR Requirements

### Prerequisites

Before submitting a PR, ensure you have:

- ✅ **Valid metadata file** with complete required fields
- ✅ **Proper filename** using SystemConfig address (lowercase)
- ✅ **Correct directory** placement based on network
- ✅ **Valid sequencer signature** in metadata
- ✅ **On-chain verification** passing for SystemConfig
- ✅ **Local validation** completed successfully

### Required Information

- **SystemConfig contract address** (deployed and accessible)
- **Sequencer private key** or signing authority
- **All L1/L2 contract addresses** properly deployed
- **RPC endpoints** accessible and responsive
- **Rollup operational** with basic functionality

## 🚀 Step-by-Step PR Submission

### Step 1: Fork the Repository

```bash
# Fork the repository via GitHub UI or CLI
gh repo fork tokamak-network/tokamak-rollup-metadata-repository

# Clone your fork
git clone https://github.com/YOUR_USERNAME/tokamak-rollup-metadata-repository.git
cd tokamak-rollup-metadata-repository

# Add upstream remote
git remote add upstream https://github.com/tokamak-network/tokamak-rollup-metadata-repository.git
```

### Step 2: Prepare Your Branch

```bash
# Make sure you're on the latest main
git checkout main
git pull upstream main

# Create feature branch with descriptive name
git checkout -b add-rollup-0x1234567890123456789012345678901234567890

# For updates to existing rollup
git checkout -b update-rollup-0x1234567890123456789012345678901234567890-withdrawal-config
```

### Step 3: Create or Update Metadata File

```bash
# 1. Check the schema structure
cat schemas/rollup-metadata.ts

# 2. Create your JSON file following the L2RollupMetadata interface
vim data/sepolia/0x1234567890123456789012345678901234567890.json
```

### Step 4: Local Validation

```bash
# Run complete validation suite
npm install
npm run validate

# Check schema compliance
npm run validate:schema

# Verify on-chain data
npm run validate:onchain

# Validate signature for registration
npm run validate:signature:register -- data/sepolia/0x1234567890123456789012345678901234567890.json

# Validate signature for updates
npm run validate:signature:update -- data/sepolia/0x1234567890123456789012345678901234567890.json
```

### Step 5: Commit Changes

```bash
# Add your metadata file
git add data/sepolia/0x1234567890123456789012345678901234567890.json

# Use descriptive commit message
git commit -m "Add rollup metadata for 0x1234567890123456789012345678901234567890

- l1ChainId: 11155111 (Sepolia)
- l2ChainId: 12345
- Name: My Awesome L2
- Network: Sepolia testnet
- SystemConfig: 0x1234567890123456789012345678901234567890
- All validations passed"
```

### Step 6: Push to Your Fork

```bash
# Push to your fork (not upstream)
git push origin add-rollup-0x1234567890123456789012345678901234567890
```

### Step 7: Create Pull Request

```bash
# Create PR via GitHub UI or CLI
gh pr create --repo tokamak-network/tokamak-rollup-metadata-repository \
  --title "[Rollup] sepolia 0x1234567890123456789012345678901234567890 - My Awesome L2" \
  --body "Add new rollup registration for My Awesome L2 on Sepolia testnet"

# Or use the GitHub web interface:
# 1. Go to your fork on GitHub
# 2. Click "Contribute" → "Open pull request"
# 3. Fill in title and description
# 4. Complete the PR template checklist
# 5. Submit the PR
```

> 📋 **Important**: When creating the PR, GitHub will show a template with a checklist. Complete all items to ensure your submission follows the requirements.

## 📝 PR Title Format

### Required Format

```
[Rollup] {network} {systemConfig_address} - {rollup_name}
[Update] {network} {systemConfig_address} - {rollup_name}
```

### Examples

```bash
# New rollup registration
[Rollup] sepolia 0x1234567890123456789012345678901234567890 - My Awesome L2

# Rollup update
[Update] mainnet 0xabcdef1234567890abcdef1234567890abcdef12 - Production L2

# Multiple files (batch update)
[Batch] sepolia - Update withdrawal configs for 3 rollups
```

### Format Rules

- **Prefix**: Use `[Rollup]` for new registrations, `[Update]` for modifications
- **Network**: Must match directory name exactly (mainnet or sepolia)
- **Address**: SystemConfig address in lowercase
- **Name**: Human-readable rollup name
- **Separators**: Use ` ` (space) between network and address, ` - ` (space-dash-space) before name

## 📄 PR Description Template

### New Rollup Registration

```markdown
## Rollup Registration

### Basic Information
- **Name**: My Awesome L2
- **l1ChainId**: 11155111 (Sepolia)
- **l2ChainId**: 12345
- **Network**: Sepolia testnet
- **SystemConfig**: 0x1234567890123456789012345678901234567890

### Contract Addresses
- **L1StandardBridge**: 0x2345678901234567890123456789012345678901
- **OptimismPortal**: 0x3456789012345678901234567890123456789012
- **L2OutputOracle**: 0x4567890123456789012345678901234567890123

### Sequencer Information
- **Address**: 0x5678901234567890123456789012345678901234
- **Multi-sig**: No
- **Signature verified**: ✅

### Network Configuration
- **RPC URL**: https://rpc.my-awesome-l2.com
- **Block time**: 2 seconds
- **Gas limit**: 30,000,000

### Validation Status
- ✅ Schema validation passed
- ✅ On-chain verification passed
- ✅ Signature verification passed
- ✅ RPC endpoint accessible
- ✅ All contract addresses deployed

### Additional Notes
This is a test rollup for development purposes on Sepolia testnet.
```

### Rollup Update

```markdown
## Rollup Update

### Changes Made
- Updated withdrawal configuration
- Added USDC bridge support
- Updated RPC endpoint URL

### SystemConfig Address
0x1234567890123456789012345678901234567890

### Validation Status
- ✅ All validations passed
- ✅ No breaking changes
- ✅ Backward compatibility maintained

### Deployment Status
- Rollup operational: ✅
- New features deployed: ✅
- Testing completed: ✅
```

## 🔍 Automated Validation Process

### GitHub Actions Workflow

When you submit a PR, the following validations run automatically:

1. **Schema Validation**
   - JSON structure compliance
   - Required fields present
   - Data type validation
   - Format rules (addresses, URLs)

2. **On-Chain Verification**
   - SystemConfig contract exists
   - Sequencer address matches `unsafeBlockSigner()`
   - Contract addresses are deployed
   - RPC endpoint responds correctly

3. **Cryptographic Verification**
   - Signature format validation
   - Message format compliance
   - Signature recovery and verification
   - Sequencer address matches on-chain sequencer

4. **Business Logic Validation**
   - Filename matches SystemConfig address
   - Directory matches network/chain ID
   - PR title format compliance
   - Single file change per PR

5. **Security Checks**
   - URL accessibility verification
   - Content security scanning

### Validation Results

Results are automatically posted as PR comments:

#### ✅ Success Example
```markdown
## ✅ Validation Successful

All validation checks passed! Your PR is ready for maintainer review.

### Validation Summary
- ✅ Schema validation passed
- ✅ On-chain verification passed
- ✅ Signature verification passed
- ✅ File naming validation passed
- ✅ Security checks passed

### Next Steps
- PR is ready for maintainer review
- No action required from submitter
- Awaiting manual approval from maintainers
```

#### ❌ Failure Example
```markdown
## ❌ Validation Failed

Please fix the following issues:

### Critical Issues
- ❌ **On-chain verification failed**: Sequencer address mismatch
  - On-chain sequencer: 0x1111111111111111111111111111111111111111
  - Metadata sequencer: 0x2222222222222222222222222222222222222222
  - **Fix**: Update sequencer address in metadata to match on-chain value

- ❌ **Signature verification failed**: Invalid signature format
  - **Fix**: Re-generate signature using correct message format

### Warnings
- ⚠️ RPC endpoint slow response (5.2s)
- ⚠️ Explorer URL not accessible

### How to Fix
1. Update metadata with correct sequencer address
2. Re-generate and update signature
3. Test RPC endpoint performance
4. Verify explorer URL accessibility
5. Run local validation: `npm run validate data/sepolia/0x1234567890123456789012345678901234567890.json`
```

## 🎯 Best Practices

### Before Submitting

- **Run local validation** multiple times to catch issues early
- **Double-check all addresses** for accuracy and case sensitivity
- **Test RPC endpoints** thoroughly for responsiveness
- **Verify signature** manually before including in metadata
- **Use correct PR title format** to avoid auto-rejection

### During Validation Process

- **Monitor PR comments** for validation results
- **Fix issues promptly** to reduce validation cycles
- **Test locally** before pushing fixes
- **Keep changes minimal** to avoid introducing new issues

### After Validation Success

- **Automatic merge** when all checks pass
- **Monitor PR status** for merge confirmation
- **Test integration** with your rollup infrastructure after merge
- **Update metadata** promptly if configuration changes

## 🚨 Common Issues and Solutions

### 1. Validation Failures

**On-chain verification fails**
```bash
# Check SystemConfig deployment
cast call $SYSTEM_CONFIG_ADDRESS "unsafeBlockSigner()" --rpc-url $RPC_URL

# Verify sequencer address matches
# Update metadata if mismatch found
```

**Signature verification fails**
```bash
# Regenerate signature with exact message format
# Use the signature generation HTML tool provided in the repository
# No automated signature generation script is available
```

### 2. File Naming Issues

**Filename doesn't match SystemConfig**
```bash
# Check SystemConfig address in metadata
jq -r '.l1Contracts.systemConfig' data/sepolia/incorrect-name.json

# Rename file to match (lowercase)
mv data/sepolia/incorrect-name.json data/sepolia/0x1234567890123456789012345678901234567890.json
```

### 3. PR Title Format

**Incorrect title format**
```bash
# Wrong: "Add my rollup"
# Correct: "[Rollup] sepolia 0x1234567890123456789012345678901234567890 - My Rollup"

# Update via GitHub UI or CLI
gh pr edit --title "[Rollup] sepolia 0x1234567890123456789012345678901234567890 - My Rollup"
```

### 4. Network Path Issues

**File in wrong directory**
```bash
# Check chain ID and network mapping
# Move file to correct directory
mv data/mainnet/0x1234567890123456789012345678901234567890.json data/sepolia/0x1234567890123456789012345678901234567890.json
```

## 🔄 Handling Validation Issues

### Fixing Failed Validations

When automated validation fails, follow these steps:

1. **Review the validation report** posted as PR comment
2. **Fix identified issues** in your metadata file
3. **Test locally** before pushing updates
4. **Push changes** to trigger re-validation
5. **Wait for auto-merge** when all checks pass

### Making Updates

```bash
# Make requested changes
vim data/sepolia/0x1234567890123456789012345678901234567890.json

# Validate changes locally
npm run validate

# Commit updates
git add data/sepolia/0x1234567890123456789012345678901234567890.json
git commit -m "Fix validation issues

- Fix sequencer address mismatch
- Update RPC endpoint URL
- Regenerate signature"

# Push updates (triggers re-validation)
git push origin add-rollup-0x1234567890123456789012345678901234567890
```

### Re-validation Process

- **Automatic**: Triggers on every push to PR branch
- **No wait time**: Validation starts immediately
- **Real-time feedback**: Results posted as PR comments

## 👥 Review Process

### Automated Review

All reviews are handled automatically through GitHub Actions validation pipeline:

- **Immediate**: Validation pipeline runs on PR submission
- **Results**: Posted as PR comments within 2-3 minutes
- **Re-validation**: Triggers on every push to PR branch
- **Auto-merge**: Automatically merges when all validations pass

### Validation Timeline

- **Schema validation**: ~30 seconds
- **On-chain verification**: ~1-2 minutes
- **Security checks**: ~30 seconds
- **Total validation time**: 2-3 minutes
- **Auto-merge**: Immediate after all checks pass

### Approval Criteria

PRs are automatically approved and merged when:

1. ✅ **All validations pass** - Schema, on-chain, signature verification
2. ✅ **Security checks pass** - No malicious patterns detected
3. ✅ **File naming correct** - Matches SystemConfig address
4. ✅ **PR title format valid** - Follows required format
5. ✅ **No conflicts** - Clean merge possible

### Review Results

#### ✅ Auto-Approval and Merge
```markdown
## ✅ Validation Successful - Auto-Merged

All validation checks passed! Your rollup has been successfully registered.

### Validation Summary
- ✅ Schema validation passed
- ✅ On-chain verification passed
- ✅ Signature verification passed
- ✅ File naming validation passed
- ✅ Security checks passed

### Next Steps
- Your rollup metadata is now live
- No further action required
- Thank you for your contribution!
```

#### ❌ Validation Failed - Manual Fix Required
```markdown
## ❌ Validation Failed - Please Fix Issues

Please fix the following issues and push updates to trigger re-validation:

### Critical Issues
- ❌ **On-chain verification failed**: Sequencer address mismatch
  - On-chain sequencer: 0x1111111111111111111111111111111111111111
  - Metadata sequencer: 0x2222222222222222222222222222222222222222
  - **Fix**: Update sequencer address in metadata to match on-chain value

- ❌ **Signature verification failed**: Invalid signature format
  - **Fix**: Re-generate signature using correct message format

### How to Fix
1. Update metadata with correct sequencer address
2. Re-generate and update signature
3. Push changes to trigger re-validation
4. PR will auto-merge when all checks pass
```

## 📊 PR Metrics and Analytics

### Success Metrics

Track your PR success with these metrics:

- **Validation pass rate**: Aim for 100% on submission
- **Time to validation**: Typical 2-3 minutes for automated checks
- **Manual review success**: Best practice achievement
- **Quality score**: Based on completeness and accuracy

### Performance Indicators

- **First-time validation success**: Best practice achievement
- **Zero validation cycles**: Exceptional quality submission
- **Fast automated approval**: Demonstrates thorough preparation
- **Community positive feedback**: High-quality contribution

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - Complete registration process
- [Validation System](validation-system.md) - Understanding validation rules
- [File Naming](file-naming.md) - Correct naming conventions
- [Metadata Schema](metadata-schema.md) - Complete field specifications
- [Development Setup](development-setup.md) - Local development environment