# Frequently Asked Questions

Comprehensive FAQ covering common questions about the Tokamak rollup metadata repository.

## 🎯 General Questions

### What is the Tokamak rollup metadata repository?

The Tokamak rollup metadata repository is a centralized registry for L2 rollup metadata built on the Tokamak SDK. It provides standardized information about rollups including contract addresses, network configurations, sequencer details, and operational parameters.

### Who can register a rollup?

Only the **rollup sequencer** can register or update metadata. This is enforced through cryptographic signature verification - the metadata must be signed by the private key of the sequencer address that matches the on-chain `SystemConfig.unsafeBlockSigner()` value.

### Is registration mandatory?

Registration is not mandatory for rollup operation, but it is **highly recommended** for:
- Integration with Tokamak ecosystem tools
- Participation in Ton Staking V2
- Enhanced discoverability and trust
- Community visibility and adoption

### What happens after registration?

After successful registration:
1. Your rollup becomes visible in ecosystem dashboards
2. Integration with staking and delegation systems becomes possible
3. Automated monitoring and indexing services can discover your rollup
4. Community members can easily find information about your rollup

## 🔧 Technical Questions

### Why do you use SystemConfig address for filenames?

The SystemConfig address is used because:
- **Uniqueness**: Each rollup has exactly one SystemConfig contract
- **Verification**: Easy to verify against on-chain data via `unsafeBlockSigner()`
- **Integration**: Ton Staking V2 uses SystemConfig address as "RollupConfig"
- **Automation**: Tools can programmatically locate metadata files
- **Consistency**: Eliminates naming conflicts and variations

### How is the sequencer verified?

Sequencer verification happens in two steps:
1. **On-chain verification**: Call `SystemConfig.unsafeBlockSigner()` to get the current sequencer
2. **Signature verification**: Verify that the metadata signature was created by the same address

This dual verification ensures only authorized sequencers can register or update metadata.

### What if my sequencer address changes?

If your sequencer address changes:
1. **Update on-chain first**: Deploy new SystemConfig or update sequencer via governance
2. **Create new signature**: Sign metadata with the new sequencer private key
3. **Submit update PR**: Include the new signature and sequencer address
4. **Automatic verification**: The system will verify the new sequencer matches on-chain data

### What L1 networks are supported?

Currently supported L1 networks for deploying SystemConfig contracts:
- **Mainnet** (Chain ID: 1) - Ethereum mainnet
- **Sepolia** (Chain ID: 11155111) - Ethereum testnet

These are the L1 networks where your SystemConfig contract should be deployed. Your L2 rollup can have any Chain ID >= 1000.

## 📝 Metadata Questions

### What information is required?

**Required fields:**
- `l1ChainId`: L1 chain identifier (where SystemConfig is deployed)
- `l2ChainId`: L2 chain identifier (rollup's own chain ID)
- `name`: Human-readable rollup name
- `description`: Brief description
- `rollupType`: "optimistic" or "zk"
- `stack`: Technology stack information
- `rpcUrl`: Primary RPC endpoint
- `nativeToken`: Native token details
- `status`: Operational status
- `l1Contracts`: All L1 contract addresses
- `sequencer`: Sequencer configuration
- `metadata`: Signature and verification data

**Optional but recommended:**
- `explorer`: Block explorer information
- `bridges`: Supported bridge protocols
- `withdrawalConfig`: Withdrawal monitoring setup
- `networkConfig`: Network operation parameters

> 📖 **For detailed field specifications**, see [Metadata Schema](metadata-schema.md)

### How do I generate the required signature?

```javascript
// 1. Format the exact message with timestamp
const timestamp = Math.floor(Date.now() / 1000);
const message = `Tokamak Rollup Registry
L1 Chain ID: ${l1ChainId}
L2 Chain ID: ${l2ChainId}
Operation: register
SystemConfig: ${systemConfigAddress.toLowerCase()}
Timestamp: ${timestamp}`;

// 2. Sign with sequencer private key
const signature = await wallet.signMessage(message);

// 3. Include in metadata and submit within 24 hours
{
  "metadata": {
    "version": "1.0.0",
    "signature": signature,
    "signedBy": wallet.address
  }
}
```

> 📖 **For complete signature guide**, see [Registration Guide - Step 5](registration-guide.md#step-5-generate-sequencer-signature)

### Can I update my metadata after registration?

Yes, metadata can be updated at any time by:
1. **Making changes** to your metadata file
2. **Generating new signature** with `Operation: update`
3. **Submitting update PR** with `[Update]` prefix in title
4. **Passing validation** including sequencer verification

> 📖 **For detailed update process**, see [Registration Guide - Updating Existing Metadata](registration-guide.md#updating-existing-metadata)

### What is the withdrawal configuration for?

The `withdrawalConfig` enables automatic withdrawal monitoring:
```json
{
  "withdrawalConfig": {
    "challengePeriod": 120,
    "expectedWithdrawalDelay": 1560,
    "monitoringInfo": {
      "l2OutputOracleAddress": "0x...",
      "outputProposedEventTopic": "0x..."
    }
  }
}
```

This allows wallets and dApps to provide real-time withdrawal status updates to users.

> 📖 **For withdrawal monitoring details**, see [Withdrawal Monitoring](withdrawal-monitoring.md)

### Why do signatures expire after 24 hours?

**Security Enhancement**: Signature expiration prevents replay attacks and ensures metadata submissions are timely and intentional.

**How it works**:
- Each signature includes a timestamp when created
- Signatures are valid for exactly 24 hours from creation
- After 24 hours, you must generate a new signature

**Best practices**:
```bash
# Generate signature and submit PR promptly
1. Create signature using HTML tool or manual generation
2. Copy signature to your metadata file
3. Submit PR within 24 hours
4. If signature expires, generate a new one

# Check signature validity
npm run validate:signature:register data/sepolia/0x1234...json
npm run validate:signature:update data/sepolia/0x1234...json
```

**What happens if my signature expires?**
- Validation will fail with clear error message
- Generate a new signature with current timestamp
- Update your metadata file and re-submit PR

> 📖 **For signature generation guide**, see [Registration Guide - Step 5](registration-guide.md#step-5-generate-sequencer-signature)

## 🔄 Process Questions

### How long does the registration process take?

**Automated process:**
- **Validation**: 2-3 minutes (GitHub Actions)
- **Merge**: Immediately after validation passes
- **No manual review required**


> 📖 **For complete registration process**, see [Registration Guide](registration-guide.md)

### What if validation fails?

If validation fails:
1. **Review the error message** posted as a PR comment
2. **Fix the issues** identified in the validation report
3. **Test locally** using `npm run validate`
4. **Push updates** to trigger re-validation
5. **Repeat** until all validations pass

> 📖 **For validation details**, see [Validation System](validation-system.md)

### Can I submit multiple rollups in one PR?

No, **one PR per rollup** is required. This ensures:
- Clear review process
- Isolated validation
- Easier error tracking
- Better Git history

For multiple rollups, submit separate PRs.

> 📖 **For PR guidelines**, see [PR Process](pr-process.md)

### What if I make a mistake after merging?

If you need to correct information after merging:
1. **Submit an update PR** with the corrections
2. **Use `[Update]` prefix** in the PR title
3. **Include explanation** of what changed and why
4. **Generate new signature** for the update

> 📖 **For PR title format and process**, see [PR Process](pr-process.md)

## 🏗️ Integration Questions

### How does this integrate with Ton Staking V2?

The metadata repository integrates with Ton Staking V2 by:
- **Using SystemConfig address** as the rollup identifier (called "RollupConfig" in staking)
- **Using candidateAddress** as the actual candidate identifier in staking service
- **Providing metadata information** in L2 tab where selected rollup details can be displayed

The `candidateAddress` field contains the generated candidate address that is used as the primary identifier for the rollup candidate in the staking system. This address is created during the staking candidate registration process and differs from the SystemConfig address.

**Note**: Metadata registration is separate from staking candidate registration. L2 operators must register as staking candidates through the L1 verification contract separately.

### Is there an API for accessing metadata?

Currently, metadata is stored as JSON files in the repository. Common access patterns:
```bash
# Direct file access
https://raw.githubusercontent.com/tokamak-network/tokamak-rollup-metadata-repository/main/data/sepolia/0x1234567890123456789012345678901234567890.json

# Programmatic access
curl -s https://raw.githubusercontent.com/tokamak-network/tokamak-rollup-metadata-repository/main/data/sepolia/0x1234567890123456789012345678901234567890.json
```

### How do I integrate withdrawal monitoring?

To integrate withdrawal monitoring:

1. **Use the withdrawal configuration** from metadata
2. **Monitor L2OutputOracle events** for OutputProposed
3. **Calculate withdrawal completion times** using the provided parameters
4. **Provide status updates** to users

Example integration:
```javascript
// Get rollup metadata
const metadata = await fetchMetadata(systemConfigAddress);
const { withdrawalConfig } = metadata;

// Monitor withdrawal status
const withdrawalMonitor = new WithdrawalMonitor(withdrawalConfig);
const status = await withdrawalMonitor.getWithdrawalStatus(withdrawalTxHash);
```

## 🛠️ Development Questions

### How do I set up the development environment?

```bash
# 1. Clone repository
git clone https://github.com/tokamak-network/tokamak-rollup-metadata-repository.git
cd tokamak-rollup-metadata-repository

# 2. Install dependencies
npm install

# 3. Test validation (works immediately with public RPCs!)
npm run validate -- --help
```

> 📖 **For complete development setup**, see [Development Setup](development-setup.md)

### What tools are available for development?

**Validation tools:**
- `npm run validate -- <file>` - Complete validation
- `npm run validate:schema <file>` - Schema validation only
- `npm run validate:onchain <file>` - On-chain verification
- `npm run validate:signature:register <file>` - Register signature verification
- `npm run validate:signature:update <file>` - Update signature verification

**Testing tools:**
- `npm test` - Run test suite
- `npm run lint` - Run linting
- `npm run build` - Build TypeScript

> 📖 **For validation system details**, see [Validation System](validation-system.md)

### How do I run local validation?

```bash
# Validate specific file
npm run validate -- data/sepolia/0x1234567890123456789012345678901234567890.json

# Validate with PR title check
npm run validate -- --pr-title "[Rollup] sepolia - 0x1234... - My L2" data/sepolia/0x1234567890123456789012345678901234567890.json

# Run specific validation types
npm run validate:schema data/sepolia/0x1234567890123456789012345678901234567890.json
npm run validate:onchain data/sepolia/0x1234567890123456789012345678901234567890.json
npm run validate:signature:register data/sepolia/0x1234567890123456789012345678901234567890.json
```

> 📖 **For local validation guide**, see [Registration Guide - Step 6](registration-guide.md#step-6-local-validation)

### Why is my file in the wrong directory?

File must be placed based on network:
- **Check chain ID**: Verify your rollup's chain ID
- **Use correct network**: Map chain ID to correct network directory
- **Create custom directory**: For chain ID >= 1000, create descriptive directory name

> 📖 **For file naming rules**, see [File Naming](file-naming.md)

### How do I contribute to the tooling?

Contributions to tooling are welcome:
1. **Submit issues** for bugs or feature requests
2. **Create PRs** for improvements to validation tools
3. **Add tests** for new functionality
4. **Update documentation** as needed

## 🚨 Troubleshooting

### Why is my on-chain verification failing?

Common causes:
- **Sequencer address mismatch**: Update metadata sequencer to match `SystemConfig.unsafeBlockSigner()`
- **Contract not deployed**: Ensure SystemConfig is deployed on the specified network
- **RPC issues**: Check RPC URL and network connectivity
- **Wrong network**: Verify you're calling the contract on the correct network

> 📖 **For validation details**, see [Validation System](validation-system.md)

### Why is signature verification failing?

Common causes:
- **Wrong message format**: Use exact format specified in docs
- **Incorrect signer**: Must sign with sequencer private key
- **Invalid signature format**: Ensure signature is valid hex string
- **Sequencer mismatch**: Signer must match on-chain sequencer address

> 📖 **For signature generation guide**, see [Registration Guide - Step 5](registration-guide.md#step-5-generate-sequencer-signature)

### Why is my file in the wrong directory?

File must be placed based on network:
- **Check chain ID**: Verify your rollup's chain ID
- **Use correct network**: Map chain ID to correct network directory
- **Create custom directory**: For chain ID >= 1000, create descriptive directory name

> 📖 **For file naming rules**, see [File Naming](file-naming.md)

### How do I fix filename errors?

Filename must exactly match SystemConfig address:
```bash
# Wrong
my-rollup.json
rollup-12345.json

# Correct (lowercase SystemConfig address)
0x1234567890123456789012345678901234567890.json
```

> 📖 **For complete naming conventions**, see [File Naming](file-naming.md)

## 📋 Best Practices

### Security Best Practices

- **Protect sequencer keys**: Never expose private keys in metadata or PRs
- **Use hardware wallets**: For production sequencers, use hardware wallet signing
- **Regular key rotation**: Consider periodic sequencer key updates
- **Monitor signatures**: Ensure only authorized signatures are used

### Operational Best Practices

- **Test thoroughly**: Validate locally before submitting PRs
- **Keep metadata updated**: Update when rollup configuration changes
- **Monitor withdrawals**: Implement withdrawal monitoring for users
- **Provide support**: Include helpful support resources in metadata

### Development Best Practices

- **Use version control**: Track metadata changes through Git
- **Document changes**: Provide clear commit messages and PR descriptions
- **Test integrations**: Verify metadata works with downstream tools
- **Follow conventions**: Adhere to naming and structure guidelines

## 📞 Getting Help

### Where can I get support?

1. **Documentation**: Check all docs in the `/docs` folder
2. **GitHub Issues**: Submit issues for bugs or questions
3. **Discord**: Join Tokamak Network Discord for community support
4. **Email**: Contact the team for urgent issues

### How do I report bugs?

1. **Check existing issues** to avoid duplicates
2. **Use issue templates** when available
3. **Include detailed information**:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Example metadata files
4. **Add relevant labels** for categorization

### How do I request features?

1. **Submit GitHub issue** with feature request template
2. **Describe the use case** and benefits
3. **Provide examples** of desired functionality
4. **Engage with community** for feedback and discussion

## 🔗 Related Resources

- [Registration Guide](registration-guide.md) - Complete registration process
- [Metadata Schema](metadata-schema.md) - Field specifications and examples
- [Validation System](validation-system.md) - Understanding validation rules
- [Development Setup](development-setup.md) - Local development environment
- [File Naming](file-naming.md) - Naming conventions and structure
- [PR Process](pr-process.md) - Pull request submission guidelines