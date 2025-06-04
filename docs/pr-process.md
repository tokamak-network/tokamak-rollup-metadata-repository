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

### Step 1: Prepare Your Branch

```bash
# Create feature branch with descriptive name
git checkout -b add-rollup-0x1234567890123456789012345678901234567890

# For updates to existing rollup
git checkout -b update-rollup-0x1234567890123456789012345678901234567890-withdrawal-config
```

### Step 2: Create or Update Metadata File

```bash
# Use interactive metadata creator
npm run create:metadata

# Or manually create file with correct naming
# data/{network}/{systemConfig_address}.json
vim data/sepolia/0x1234567890123456789012345678901234567890.json
```

### Step 3: Local Validation

```bash
# Run complete validation suite
npm run validate data/sepolia/0x1234567890123456789012345678901234567890.json

# Check for common issues
npm run validate:schema data/sepolia/*.json
npm run validate:onchain data/sepolia/*.json
npm run validate:signature data/sepolia/*.json

# Validate PR title format
npm run validate -- --pr-title "[Rollup] sepolia - 0x1234567890123456789012345678901234567890 - My Awesome L2" data/sepolia/0x1234567890123456789012345678901234567890.json
```

### Step 4: Commit Changes

```bash
# Add your metadata file
git add data/sepolia/0x1234567890123456789012345678901234567890.json

# Use descriptive commit message
git commit -m "Add rollup metadata for 0x1234567890123456789012345678901234567890

- Chain ID: 12345
- Name: My Awesome L2
- Network: Sepolia testnet
- Sequencer: 0x5678...
- All validations passed"
```

### Step 5: Push and Create PR

```bash
# Push to your fork
git push origin add-rollup-0x1234567890123456789012345678901234567890

# Create PR via GitHub UI or CLI
gh pr create --title "[Rollup] sepolia - 0x1234567890123456789012345678901234567890 - My Awesome L2" --body "PR description"
```

## 📝 PR Title Format

### Required Format

```
[Rollup] {network} - {systemConfig_address} - {rollup_name}
```

### Examples

```bash
# New rollup registration
[Rollup] sepolia - 0x1234567890123456789012345678901234567890 - My Awesome L2

# Rollup update
[Update] mainnet - 0xabcdef1234567890abcdef1234567890abcdef12 - Production L2

# Multiple files (batch update)
[Batch] sepolia - Update withdrawal configs for 3 rollups
```

### Format Rules

- **Prefix**: Use `[Rollup]` for new registrations, `[Update]` for modifications
- **Network**: Must match directory name exactly
- **Address**: SystemConfig address in lowercase
- **Name**: Human-readable rollup name
- **Separators**: Use ` - ` (space-dash-space) between elements

## 📄 PR Description Template

### New Rollup Registration

```markdown
## Rollup Registration

### Basic Information
- **Name**: My Awesome L2
- **Chain ID**: 12345
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
   - Timestamp validation (within 24 hours)

4. **Business Logic Validation**
   - Filename matches SystemConfig address
   - Directory matches network/chain ID
   - PR title format compliance
   - No duplicate chain IDs

5. **Security Checks**
   - URL accessibility verification
   - Known malicious address detection
   - Content security scanning

### Validation Results

Results are automatically posted as PR comments:

#### ✅ Success Example
```markdown
## ✅ Validation Successful

All validation checks passed! Your PR is ready for review.

### Validation Summary
- ✅ Schema validation passed
- ✅ On-chain verification passed
- ✅ Signature verification passed
- ✅ File naming validation passed
- ✅ Security checks passed

### Next Steps
- PR is ready for maintainer review
- No action required from submitter
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
5. Run local validation: `npm run validate data/sepolia/0x1234*.json`
```

## 👥 Review Process

### Automated Review

- **Immediate**: Validation pipeline runs on PR submission
- **Results**: Posted as PR comments within 2-3 minutes
- **Re-validation**: Triggers on every push to PR branch

### Human Review

#### Review Criteria

Maintainers review for:

1. **Technical Correctness**
   - All validations passing
   - Metadata completeness and accuracy
   - Proper integration compatibility

2. **Security Assessment**
   - Sequencer signature authenticity
   - Contract deployment verification
   - No suspicious patterns or malicious content

3. **Operational Readiness**
   - RPC endpoints stable and accessible
   - Rollup operational and functional
   - Documentation quality

4. **Community Standards**
   - Appropriate naming and descriptions
   - Professional presentation
   - Compliance with repository guidelines

#### Review Timeline

- **Automated validation**: 2-3 minutes
- **Initial review**: 1-2 business days
- **Follow-up reviews**: 1 business day after changes
- **Final approval**: Same day if all requirements met

### Review Feedback Categories

#### 🚫 Blocking Issues (Must Fix)
- Validation failures
- Security concerns
- Missing required information
- Incorrect metadata format

#### ⚠️ Improvement Suggestions (Recommended)
- Better naming/descriptions
- Additional configuration options
- Performance optimizations
- Documentation enhancements

#### 💡 Enhancement Ideas (Optional)
- Future improvements
- Best practice recommendations
- Community integration suggestions

## 🔄 Handling Review Feedback

### Addressing Feedback

1. **Read all feedback carefully**
2. **Fix blocking issues first**
3. **Address suggestions where possible**
4. **Ask questions if unclear**
5. **Update and push changes**

### Making Updates

```bash
# Make requested changes
vim data/sepolia/0x1234567890123456789012345678901234567890.json

# Validate changes locally
npm run validate data/sepolia/0x1234567890123456789012345678901234567890.json

# Commit updates
git add data/sepolia/0x1234567890123456789012345678901234567890.json
git commit -m "Address review feedback

- Fix sequencer address mismatch
- Update RPC endpoint URL
- Add missing bridge configuration"

# Push updates
git push origin add-rollup-0x1234567890123456789012345678901234567890
```

### Responding to Reviewers

```markdown
## Response to Review

Thank you for the feedback! I've addressed all the issues:

### Fixed Issues
- ✅ Updated sequencer address to match on-chain value
- ✅ Regenerated signature with correct format
- ✅ Updated RPC endpoint URL
- ✅ Fixed explorer URL

### Questions
> Should we include additional bridge configurations?

We currently only support ETH transfers, but plan to add USDC support in the next release. Should I include placeholder configuration now or add it later?

### Validation
- ✅ All local validations now pass
- ✅ Re-tested all endpoints
- ✅ Verified signature integrity
```

## 🎯 Best Practices

### Before Submitting

- **Double-check all addresses** for accuracy and case sensitivity
- **Test RPC endpoints** thoroughly for responsiveness
- **Verify signature** manually before including in metadata
- **Run complete validation** locally multiple times
- **Check for typos** in descriptions and URLs

### During Review Process

- **Respond promptly** to feedback and questions
- **Be thorough** in addressing all feedback points
- **Ask for clarification** when feedback is unclear
- **Test changes** locally before pushing updates
- **Keep communication professional** and constructive

### After Approval

- **Monitor rollup operation** to ensure everything works correctly
- **Update metadata** promptly if configuration changes
- **Report issues** if automated systems detect problems
- **Contribute improvements** to documentation and tools

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
node scripts/generate-signature.js --chain-id 12345 --private-key $PRIVATE_KEY

# Ensure timestamp is recent (within 24 hours)
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
# Correct: "[Rollup] sepolia - 0x1234567890123456789012345678901234567890 - My Rollup"

# Update via GitHub UI or CLI
gh pr edit --title "[Rollup] sepolia - 0x1234567890123456789012345678901234567890 - My Rollup"
```

### 4. Network Path Issues

**File in wrong directory**
```bash
# Check chain ID and network mapping
# Move file to correct directory
mv data/mainnet/0x1234*.json data/sepolia/0x1234*.json
```

## 📊 PR Metrics and Analytics

### Success Metrics

Track your PR success with these metrics:

- **Validation pass rate**: Aim for 100% on submission
- **Review cycles**: Target 1-2 cycles for approval
- **Time to merge**: Typical 2-5 business days
- **Quality score**: Based on completeness and accuracy

### Performance Indicators

- **First-time validation success**: Best practice achievement
- **Zero review cycles**: Exceptional quality submission
- **Fast approval**: Demonstrates thorough preparation
- **Community positive feedback**: High-quality contribution

## 🔗 Related Documentation

- [Registration Guide](registration-guide.md) - Complete registration process
- [Validation System](validation-system.md) - Understanding validation rules
- [File Naming](file-naming.md) - Correct naming conventions
- [Metadata Schema](metadata-schema.md) - Complete field specifications
- [Development Setup](development-setup.md) - Local development environment