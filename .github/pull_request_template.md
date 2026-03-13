## Metadata Submission

### Stack Type
- [ ] **Tokamak Appchain** (`tokamak-appchain-data/` directory)
- [ ] **Thanos** (`data/` directory)

### Type of Submission
- [ ] **New registration** (`[Appchain]` or `[Rollup]` in PR title)
- [ ] **Update existing metadata** (`[Update]` in PR title)
- [ ] **Remove metadata** (`[Remove]` in PR title)

### PR Title Format

**Tokamak Appchain stack:**
- New: `[Appchain] {l1ChainId}/{stackType}/{identityContract} - {name}`
- Update: `[Update] {l1ChainId}/{stackType}/{identityContract} - {name}`

**Thanos stack:**
- New: `[Rollup] <network> <systemConfig_address> - <rollup_name>`
- Update: `[Update] <network> <systemConfig_address> - <rollup_name>`

### Pre-submission Checklist
- [ ] PR title follows the correct format above
- [ ] All addresses are **lowercase** and 0x-prefixed
- [ ] Filename matches the identity contract address
- [ ] Only one metadata file added/modified
- [ ] Metadata signed with the correct operation (`register` or `update`)
- [ ] I am the authorized operator/sequencer of this rollup
- [ ] Local validation passes (`npx ts-node scripts/validate-metadata.ts ...`)

---

**All details are in the metadata file. This submission confirms I have the authority to register/update this rollup.**
