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

### What networks are supported?

Currently supported networks:
- **Mainnet** (Chain ID: 1)
- **Sepolia** (Chain ID: 11155111)
- **Holesky** (Chain ID: 17000)
- **Optimism** (Chain ID: 10)
- **Base** (Chain ID: 8453)
- **Arbitrum One** (Chain ID: 42161)

For rollups with Chain ID >= 1000, you can create custom network directories.

## 📝 Metadata Questions

### What information is required?

**Required fields:**
- `chainId`: Unique chain identifier
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

### How do I generate the required signature?

```javascript
// 1. Format the exact message
const message = `Tokamak Rollup Registry
Chain ID: ${chainId}
Operation: register
Timestamp: ${Math.floor(Date.now() / 1000)}`;

// 2. Sign with sequencer private key
const signature = await wallet.signMessage(message);

// 3. Include in metadata
{
  "metadata": {
    "version": "1.0.0",
    "signature": signature,
    "signedBy": wallet.address,
    "signedAt": new Date().toISOString(),
    "message": message
  }
}
```

### Can I update my metadata after registration?

Yes, metadata can be updated at any time by:
1. **Making changes** to your metadata file
2. **Generating new signature** with updated timestamp
3. **Submitting update PR** with `[Update]` prefix in title
4. **Passing validation** including sequencer verification

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
    },
    "supportResources": {
      "statusPageUrl": "https://status.my-l2.com",
      "supportContactUrl": "https://support.my-l2.com"
    }
  }
}
```

This allows wallets and dApps to provide real-time withdrawal status updates to users.

## 🔄 Process Questions

### How long does the registration process take?

**Automated process:**
- **Validation**: 2-3 minutes (GitHub Actions)
- **Merge**: Immediately after validation passes
- **No manual review required**

**For faster processing:**
- Ensure all validations pass locally before submitting
- Include complete and accurate information
- Follow all guidelines precisely

### What if validation fails?

If validation fails:
1. **Review the error message** posted as a PR comment
2. **Fix the issues** identified in the validation report
3. **Test locally** using `npm run validate`
4. **Push updates** to trigger re-validation
5. **Repeat** until all validations pass

### Can I submit multiple rollups in one PR?

No, **one PR per rollup** is required. This ensures:
- Clear review process
- Isolated validation
- Easier error tracking
- Better Git history

For multiple rollups, submit separate PRs.

### What if I make a mistake after merging?

If you need to correct information after merging:
1. **Submit an update PR** with the corrections
2. **Use `[Update]` prefix** in the PR title
3. **Include explanation** of what changed and why
4. **Generate new signature** for the update

## 🏗️ Integration Questions

### How does this integrate with Ton Staking V2?

The metadata repository integrates with Ton Staking V2 by:
- **Using SystemConfig address** as the rollup identifier (called "RollupConfig" in staking)
- **Providing metadata lookup** for staking interfaces
- **Displaying rollup information** in staking UI (name, description, status, etc.)
- **Showing bridge information** for users to access L2 deposits and withdrawals
- **Providing explorer links** for transaction monitoring and rollup exploration
- **Tracking staking status** in the `staking` field
- **Enabling delegation UI** integration

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

### Why is signature verification failing?

Common causes:
- **Wrong message format**: Use exact format specified in docs
- **Incorrect signer**: Must sign with sequencer private key
- **Expired timestamp**: Signature must be within 24 hours
- **Invalid signature format**: Ensure signature is valid hex string

### Why is my file in the wrong directory?

File must be placed based on network:
- **Check chain ID**: Verify your rollup's chain ID
- **Use correct network**: Map chain ID to correct network directory
- **Create custom directory**: For chain ID >= 1000, create descriptive directory name

### How do I fix filename errors?

Filename must exactly match SystemConfig address:
```bash
# Wrong
my-rollup.json
rollup-12345.json

# Correct (lowercase SystemConfig address)
0x1234567890123456789012345678901234567890.json
```

### What if my RPC endpoint is slow?

If RPC validation times out:
- **Optimize RPC performance**: Use faster RPC provider
- **Check network issues**: Verify connectivity to your RPC
- **Increase timeout**: Set longer timeout in validation
- **Use backup RPC**: Configure alternative RPC endpoints

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