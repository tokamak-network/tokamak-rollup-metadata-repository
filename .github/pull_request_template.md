## 🚀 Rollup Metadata Submission

### 📋 Rollup Information
- **Network**: [ ] mainnet [ ] sepolia
- **SystemConfig Address** (소문자):
- **Rollup Name**:
- **Rollup Type**: [ ] optimistic [ ] zk [ ] sovereign [ ] validium
- **Stack**: (e.g., thanos, zk-evm, polygon-cdk)
- **Sequencer Address**:
- **Signature**:

### 🔗 Infrastructure Information
- **RPC URL**:
- **Explorer URL**:
- **Bridge URL**:
- **Website**: (optional)

### 📝 Description
Please include a summary of your L2 rollup and what makes it unique.

### 🏗️ Type of Submission
- [ ] **New rollup registration** (use `[Rollup]` in PR title)
- [ ] **Update existing rollup metadata** (use `[Update]` in PR title)
- [ ] Rollup shutdown notification
- [ ] Other (please describe)

### ✅ Pre-submission Checklist
- [ ] My PR title follows the correct format:
  - **For new registration**: `[Rollup] <network> - <systemConfig_address> - <rollup_name>`
  - **For updates**: `[Update] <network> - <systemConfig_address> - <rollup_name>`
- [ ] I have used **lowercase** for the SystemConfig address in both filename and PR title
- [ ] My filename is `<systemConfig_address>.json` (lowercase)
- [ ] I have added only one rollup metadata file
- [ ] I have verified all contract addresses are correct
- [ ] I have signed the metadata with the correct operation:
  - **New registration**: `Operation: register`
  - **Updates**: `Operation: update`
- [ ] I have verified the SystemConfig address matches the PR title and filename
- [ ] I have verified the network (mainnet/sepolia) matches the PR title
- [ ] All bridges and explorers are accessible
- [ ] I understand this is for **sequencer-only** submissions

### 🔐 Sequencer Verification
This PR can only be submitted by the authorized sequencer of the L2 rollup. The signature in the metadata must be generated using the same private key that operates the sequencer.

**How to generate your signature:**
1. Use the message format: `Tokamak Rollup Registry\nChain ID: <chainId>\nOperation: <operation>\nSystemConfig: <systemConfig>`
2. **Operation values**:
   - Use `register` for new rollup registration
   - Use `update` for metadata updates
3. Sign with your sequencer private key
4. Include the signature in the metadata file

### 🌐 Staking Integration (SystemConfig = RollupConfig)
- [ ] This rollup will be a candidate for Tokamak Staking V2
- [ ] I understand that **SystemConfig** and **RollupConfig** refer to the same contract
- [ ] I understand the staking requirements and rewards system
- [ ] I have reviewed the shutdown procedures and their impact on staking

### 📚 Important Notes

#### SystemConfig vs RollupConfig
- **SystemConfig**: The L1 contract name in Optimism/Thanos stack
- **RollupConfig**: The same contract as referred to in Tokamak Staking V2
- **Same Address**: Both terms refer to the identical contract address

#### File Naming Rules
- **Format**: `<systemConfig_address>.json`
- **Case**: **All lowercase** (e.g., `0xabcd...`, not `0xABCD...`)
- **Location**: `data/<network>/`

#### Additional Information
- Only authorized sequencers can submit rollup metadata
- All metadata is publicly accessible once merged
- Shutdown notifications require proper advance notice for staking participants

---

**By submitting this PR, I confirm that I am the authorized sequencer of this L2 rollup and have the authority to register its metadata.**