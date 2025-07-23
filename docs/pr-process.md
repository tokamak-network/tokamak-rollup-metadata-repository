# Pull Request Process

Quick guide for submitting rollup metadata.

## 🚀 Quick Steps

### 1. Fork & Clone
```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/tokamak-rollup-metadata-repository.git
cd tokamak-rollup-metadata-repository
```

### 2. Create Metadata File
```bash
# Create file: data/{network}/{systemConfig_address}.json
# Use lowercase for systemConfig address
# Example: data/sepolia/0x1234567890123456789012345678901234567890.json
```

### 3. Local Validation
```bash
npm install
npm run validate data/sepolia/0x1234567890123456789012345678901234567890.json
```

### 4. Create PR
- **Title format**: `[Rollup] sepolia 0x1234567890123456789012345678901234567890 - My L2`
- **Template checklist**: Complete all items in PR template
- **That's it!** GitHub Actions handles the rest

## ✅ What Happens Next

1. **Auto-validation** runs (2-3 minutes)
2. **Results posted** as PR comment
3. **Auto-merge** if all checks pass
4. **Done!** Your rollup is registered

## 🚨 If Validation Fails

- Check the **automated comment** for specific errors
- Fix issues in your metadata file
- Push changes (triggers re-validation)
- Wait for auto-merge

## 📋 PR Title Formats

```bash
# New rollup
[Rollup] {network} {systemConfig_address} - {L2_Name}

# Update existing
[Update] {network} {systemConfig_address} - {L2_Name}
```

### Examples:
```bash
# New rollup
[Rollup] sepolia 0x1234567890123456789012345678901234567890 - My L2

# Update existing
[Update] mainnet 0xabcdef1234567890abcdef1234567890abcdef12 - My L2
```

### Format Rules:
- `{network}`: lowercase network name (e.g., sepolia, mainnet, goerli)
- `{systemConfig_address}`: lowercase systemConfig contract address
- `{L2_Name}`: Your L2 rollup name
- Use `[Rollup]` for new rollups, `[Update]` for existing rollup updates

## 🔗 Need More Help?

- [Registration Guide](registration-guide.md) - Complete setup process
- [Validation System](validation-system.md) - Understanding validation
- [Metadata Schema](metadata-schema.md) - Field specifications

---

**The system is fully automated - just follow the steps above!** 🎯