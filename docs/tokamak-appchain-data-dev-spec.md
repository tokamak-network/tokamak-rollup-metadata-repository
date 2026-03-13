# tokamak-appchain-data — Detailed Development Spec

## 1. Schema Spec

### 1-1. New file: `schemas/tokamak-appchain-metadata.ts`

**Required fields** (validation must reject if missing):

| Field | Type | Validation Rule |
|-------|------|-----------------|
| `l1ChainId` | number | Must be positive integer. Must match folder name in path. |
| `l2ChainId` | number | Must be positive integer. |
| `name` | string | Non-empty, max 100 chars. Must match PR title name. |
| `description` | string | Non-empty, max 500 chars. |
| `stackType` | enum | Must be one of: `tokamak-appchain`, `tokamak-private-app-channel`, `thanos`, `py-ethclient`. Must match folder name in path. |
| `rpcUrl` | string | Valid URL format (http:// or https://). |
| `status` | enum | `active` \| `inactive` \| `maintenance` \| `deprecated` \| `shutdown` |
| `createdAt` | string | ISO 8601 format. Immutable after creation. |
| `lastUpdated` | string | ISO 8601 format. Must be within 1 hour of current time on update. Must be > previous value. |
| `nativeToken` | object | See below. |
| `l1Contracts` | object | Stack-specific required fields (see below). |
| `operator` | object | `address` required, valid Ethereum address format. |
| `metadata` | object | `version`, `signature` (130-char hex), `signedBy` (valid address). |

**Optional fields:**

| Field | Type | Validation Rule |
|-------|------|-----------------|
| `logo` | string | Valid URL if provided. |
| `website` | string | Valid URL if provided. |
| `stackVersion` | string | Free text. |
| `wsUrl` | string | Valid WebSocket URL (ws:// or wss://) if provided. |
| `l2Contracts` | object | All values must be valid addresses. |
| `bridges` | array | Each entry: `name` (required), `type` (enum), `url` (valid URL). |
| `explorers` | array | Each entry: `name` (required), `url` (valid URL), `type` (enum). |
| `networkConfig` | object | `blockTime` > 0, `gasLimit` non-empty string. |
| `supportResources` | object | All values must be valid URLs if provided. |

**nativeToken validation:**

```
type: "eth" → l1Address is optional (ignored)
type: "erc20" → l1Address is REQUIRED, must be valid address
symbol: required, non-empty
name: required, non-empty
decimals: required, positive integer
```

**Stack-specific l1Contracts required fields:**

```
stackType: "tokamak-appchain"
  REQUIRED: OnChainProposer (must match filename)
  OPTIONAL: CommonBridge, Timelock, SP1Verifier, GuestProgramRegistry, [any]

stackType: "thanos"
  REQUIRED: SystemConfig (must match filename)
  OPTIONAL: L1StandardBridge, OptimismPortal, L2OutputOracle, [any]

stackType: "tokamak-private-app-channel"
  REQUIRED: (TBD — at minimum one identity contract matching filename)
  OPTIONAL: [any]

stackType: "py-ethclient"
  REQUIRED: (TBD — at minimum one identity contract matching filename)
  OPTIONAL: [any]
```

**Immutable fields** (cannot change on update):

```
l1ChainId
l2ChainId
stackType
createdAt
Identity contract address (OnChainProposer / SystemConfig / etc.)
```

### 1-2. Identity Contract Resolution

Each stack type defines which l1Contracts field is the "identity contract" (= filename):

```typescript
function getIdentityContractField(stackType: string): string {
  switch (stackType) {
    case "tokamak-appchain": return "OnChainProposer";
    case "thanos": return "SystemConfig";
    case "tokamak-private-app-channel": return "TBD";  // define later
    case "py-ethclient": return "TBD";                  // define later
    default: throw new Error(`Unknown stack type: ${stackType}`);
  }
}
```

---

## 2. Validator Spec

### 2-1. Path Parsing

**Input:** `tokamak-appchain-data/11155111/tokamak-appchain/0xabc...def.json`

**Output:**
```typescript
interface AppchainPathInfo {
  isAppchainData: true;
  l1ChainId: number;       // 11155111
  stackType: string;        // "tokamak-appchain"
  identityContract: string; // "0xabc...def"
}
```

**Parsing logic:**
```typescript
function parseAppchainPath(filepath: string): AppchainPathInfo | null {
  const match = filepath.match(
    /^tokamak-appchain-data\/(\d+)\/([a-z0-9-]+)\/0x([a-f0-9]{40})\.json$/
  );
  if (!match) return null;
  return {
    isAppchainData: true,
    l1ChainId: parseInt(match[1]),
    stackType: match[2],
    identityContract: "0x" + match[3],
  };
}
```

**Error cases:**
| Input | Error |
|-------|-------|
| `tokamak-appchain-data/abc/tokamak-appchain/0x...json` | "L1 chain ID folder must be a number" |
| `tokamak-appchain-data/11155111/unknown-stack/0x...json` | "Unknown stack type: unknown-stack" |
| `tokamak-appchain-data/11155111/tokamak-appchain/invalid.json` | "Filename must be a valid lowercase Ethereum address" |
| `tokamak-appchain-data/11155111/0x...json` | "Missing stack type folder" |

### 2-2. Schema Validator (`appchain-schema-validator.ts`)

**Extends:** Uses `ajv` like existing `schema-validator.ts`.

**Logic:**
1. Load JSON file
2. Validate against `TokamakAppchainMetadata` JSON Schema
3. Stack-specific required field check:
   - Get `stackType` from JSON
   - Check required l1Contracts fields for that stack
4. All address fields → lowercase 0x-prefixed hex, 42 chars
5. All URL fields → valid URL format
6. Enum fields → allowed values only

**Error messages:**
```
"Missing required field: operator.address"
"Invalid address format for l1Contracts.OnChainProposer: expected lowercase 0x-prefixed, got 0xABC..."
"nativeToken.type is 'erc20' but l1Address is missing"
"stackType 'tokamak-appchain' requires l1Contracts.OnChainProposer"
"Invalid URL format for rpcUrl: ftp://not-http"
```

### 2-3. Contract Validator (`appchain-contract-validator.ts`)

**Per-stack verification flow:**

#### tokamak-appchain:

```
Step 1: Set L1 RPC provider for l1ChainId
Step 2: eth_getCode(OnChainProposer) → must not be "0x"
  ERROR: "No contract deployed at OnChainProposer address 0x... on chain 11155111"
Step 3: OnChainProposer.owner() → returns address (Timelock or direct owner)
  ERROR: "Failed to call owner() on OnChainProposer: [revert reason]"
Step 4: Check if owner is a Timelock (has admin() function)
  If yes: Timelock.admin() → must match metadata.metadata.signedBy
  If no: owner itself must match metadata.metadata.signedBy
  ERROR: "Signer 0xABC does not match OnChainProposer owner chain. On-chain owner: 0xDEF"
Step 5: eth_chainId via metadata.rpcUrl → must match l2ChainId
  ERROR: "L2 chain ID mismatch: metadata says 12345, RPC reports 67890"
  TIMEOUT ERROR: "L2 RPC at https://... is unreachable (timeout 10s)"
```

**OnChainProposer ABI needed:**
```solidity
function owner() external view returns (address)
```

**Timelock ABI needed:**
```solidity
function admin() external view returns (address)
```

#### thanos:

```
Step 1: Set L1 RPC provider for l1ChainId
Step 2: eth_getCode(SystemConfig) → must not be "0x"
Step 3: SystemConfig.unsafeBlockSigner() → must match metadata.metadata.signedBy
Step 4: If nativeToken.type == "erc20":
  SystemConfig.nativeTokenAddress() → must match nativeToken.l1Address
Step 5: eth_chainId via metadata.rpcUrl → must match l2ChainId
```

(Same as existing `contract-validator.ts` logic.)

#### tokamak-private-app-channel / py-ethclient:

```
Step 1: Set L1 RPC provider for l1ChainId
Step 2: eth_getCode(identityContract) → must not be "0x"
Step 3: eth_chainId via metadata.rpcUrl → must match l2ChainId
  (No specific owner verification until identity contract is defined)
```

**RPC timeout handling:**
- L1 RPC calls: 15s timeout, retry 1x
- L2 RPC calls: 10s timeout, no retry
- Error: `"L1 RPC call to chain 11155111 timed out after 15s (tried 2 times)"`

### 2-4. Signature Validator (modifications to existing)

**New message format:**
```
Tokamak Appchain Registry
L1 Chain ID: {l1ChainId}
L2 Chain ID: {l2ChainId}
Stack: {stackType}
Operation: {register|update}
Contract: {identityContractAddress_lowercase}
Timestamp: {unixTimestamp}
```

**Verification flow:**
```
1. Is this an appchain-data file? (check path)
   YES → use new message format
   NO → use existing legacy format (unchanged)

2. Validate signature format: /^0x[a-fA-F0-9]{130}$/
   ERROR: "Invalid signature format: expected 130 hex chars after 0x"

3. Extract expected timestamp:
   register → createdAt as unix timestamp
   update → lastUpdated as unix timestamp

4. Build expected message string

5. ethers.verifyMessage(message, signature) → recoveredAddress

6. recoveredAddress == metadata.signedBy?
   NO → "Signature verification failed: recovered 0xABC, expected 0xDEF"

7. recoveredAddress == on-chain owner (from contract validator)?
   NO → "Signer 0xABC does not match on-chain identity. On-chain: 0xDEF"

8. Timestamp checks:
   - Age < 24 hours? → "Signature expired: {N} hours old, max 24h"
   - Not future? → "Signature timestamp cannot be in the future"
   - Matches metadata field? → "Signature timestamp {X} does not match createdAt {Y}"
```

### 2-5. Network Validator (modifications)

**Current:** Validates `data/{network}/` paths with network name.
**New:** Also validates `tokamak-appchain-data/{chainId}/{stackType}/` paths.

```typescript
function parsePathInfo(filepath: string): LegacyPathInfo | AppchainPathInfo {
  if (filepath.startsWith("data/")) {
    // existing logic
    return { type: "legacy", network: "sepolia", ... };
  }
  if (filepath.startsWith("tokamak-appchain-data/")) {
    return parseAppchainPath(filepath);
  }
  throw new Error(`Unknown path format: ${filepath}`);
}
```

**PR title format (new):**
```
[Appchain] {l1ChainId}/{stackType} {identityContract} - {name}
[Update] {l1ChainId}/{stackType} {identityContract} - {name}
```

**Regex:**
```
/^\[(Appchain|Update)\] (\d+)\/([\w-]+) 0x([a-fA-F0-9]{40}) - (.+)$/
```

**Validation:**
- `l1ChainId` from title == `l1ChainId` from file path == `l1ChainId` in JSON
- `stackType` from title == `stackType` from file path == `stackType` in JSON
- `identityContract` from title == filename == l1Contracts[identityField] in JSON
- `name` from title == `name` in JSON

### 2-6. File Validator (modifications)

**Immutable fields for appchain-data:**
```typescript
const APPCHAIN_IMMUTABLE_FIELDS = [
  "l1ChainId",
  "l2ChainId",
  "stackType",
  "createdAt",
  // Identity contract field depends on stack type
];

function getImmutableFields(stackType: string): string[] {
  const field = getIdentityContractField(stackType);
  return [...APPCHAIN_IMMUTABLE_FIELDS, `l1Contracts.${field}`];
}
```

**GitHub Raw URL for existing file check (update operations):**
```
Current: https://raw.githubusercontent.com/.../main/data/sepolia/0x...json
New:     https://raw.githubusercontent.com/.../main/tokamak-appchain-data/11155111/tokamak-appchain/0x...json
```

### 2-7. Rollup Validator Orchestrator (modifications)

**Routing logic in `validateRollupMetadata()`:**

```typescript
async validateMetadata(
  metadata: L2RollupMetadata | TokamakAppchainMetadata,
  filepath: string,
  prTitle?: string,
): Promise<{ valid: boolean; errors: string[] }> {
  const pathInfo = parsePathInfo(filepath);

  if (pathInfo.type === "legacy") {
    // Existing validation — NO CHANGES
    return this.validateRollupMetadata(metadata as L2RollupMetadata, filepath, prTitle);
  }

  // New appchain-data validation
  return this.validateAppchainMetadata(metadata as TokamakAppchainMetadata, filepath, prTitle, pathInfo);
}
```

**New `validateAppchainMetadata()` — 10 validation steps:**

```
Step 1: Parse path → extract l1ChainId, stackType, identityContract
Step 2: Schema validation (appchain-schema-validator)
Step 3: PR title validation (if provided) — format + consistency
Step 4: Filename matches identity contract in JSON
Step 5: l1ChainId from path == l1ChainId in JSON
Step 6: stackType from path == stackType in JSON
Step 7: Contract existence on L1 (appchain-contract-validator)
Step 8: On-chain ownership verification (stack-specific)
Step 9: Signature verification (new message format)
Step 10: Timestamp validation (same rules as existing)
  - register: file must NOT exist in main
  - update: file must exist, immutable fields unchanged, lastUpdated sequential
```

---

## 3. CI/CD Spec

### 3-1. Workflow Trigger Update

```yaml
paths:
  - 'data/**/*.json'
  - 'tokamak-appchain-data/**/*.json'   # ADD THIS
```

### 3-2. File Detection Logic

```bash
FILE="${{ steps.changed-files.outputs.all_changed_files }}"

if [[ "$FILE" == tokamak-appchain-data/* ]]; then
  METADATA_TYPE="appchain"
  # Parse: tokamak-appchain-data/{l1ChainId}/{stackType}/{contract}.json
  L1_CHAIN_ID=$(echo "$FILE" | cut -d'/' -f2)
  STACK_TYPE=$(echo "$FILE" | cut -d'/' -f3)
  IDENTITY_CONTRACT=$(basename "$FILE" .json)
elif [[ "$FILE" == data/* ]]; then
  METADATA_TYPE="legacy"
fi
```

### 3-3. PR Title Validation (updated regex)

```bash
# Legacy: [Rollup] sepolia 0xabc...def - MyRollup
# Legacy: [Update] sepolia 0xabc...def - MyRollup
# Appchain: [Appchain] 11155111/tokamak-appchain 0xabc...def - MyAppchain
# Appchain: [Update] 11155111/tokamak-appchain 0xabc...def - MyAppchain

if [ "$METADATA_TYPE" = "appchain" ]; then
  REGEX='^\[(Appchain|Update)\] [0-9]+/[a-z0-9-]+ 0x[a-fA-F0-9]{40} - .+$'
else
  REGEX='^\[(Rollup|Update)\] (mainnet|sepolia) 0x[a-fA-F0-9]{40} - .+$'
fi
```

### 3-4. Validation Command

```bash
if [ "$METADATA_TYPE" = "appchain" ]; then
  npm run validate:appchain -- --pr-title "$PR_TITLE" "$FILE"
else
  npm run validate -- --pr-title "$PR_TITLE" "$FILE"
fi
```

### 3-5. PR Comment (updated)

Add appchain-specific checks to the success/failure message:
```
- ✅ Path structure validation ({l1ChainId}/{stackType}/{contract})
- ✅ Stack-specific contract verification
- ✅ Appchain signature verification (new format)
```

---

## 4. Error Handling

### Error Categories

| Category | HTTP-equivalent | Action |
|----------|----------------|--------|
| Schema error | 400 | Reject immediately, show exact field/value |
| Path error | 400 | Reject, show expected vs actual path |
| L1 RPC unreachable | 503 | Retry 1x, then fail with "L1 RPC unreachable" |
| L2 RPC unreachable | 503 | Fail with warning (not blocking — chain may be down temporarily) |
| Contract not found | 404 | Reject with address + chain ID |
| Signature invalid | 401 | Reject with recovered vs expected address |
| Signature expired | 401 | Reject with age in hours |
| Immutable field changed | 409 | Reject with field name + old/new values |
| File exists (on register) | 409 | Reject with "File already exists, use [Update]" |
| File missing (on update) | 404 | Reject with "File not found, use [Appchain]" |

### Error Message Format

All error messages should be actionable:
```
BAD:  "Validation failed"
GOOD: "l1Contracts.OnChainProposer address (0xabc) does not match filename (0xdef).
       Rename file to 0xabc.json or fix l1Contracts.OnChainProposer in the JSON."
```

### L2 RPC Unreachable — Non-blocking?

**Decision:** L2 RPC check (eth_chainId) should be **blocking** for `register` but **warning-only** for `update`.

Reasoning:
- Register: chain must be verifiable at registration time
- Update: chain may be temporarily down during maintenance, metadata update should still be allowed

```typescript
if (operation === "register" && !l2Reachable) {
  errors.push("L2 RPC unreachable — chain must be online for initial registration");
}
if (operation === "update" && !l2Reachable) {
  warnings.push("L2 RPC unreachable — chain may be under maintenance");
}
```

---

## 5. Testing Spec

### 5-1. Unit Tests

**File:** `tests/appchain-validation.test.ts`

#### Path Parsing Tests
```
✓ parses valid tokamak-appchain path
✓ parses valid thanos path in appchain-data
✓ rejects non-numeric chain ID folder
✓ rejects unknown stack type
✓ rejects invalid address filename
✓ rejects missing stack type folder
✓ distinguishes data/ from tokamak-appchain-data/ paths
```

#### Schema Validation Tests
```
✓ accepts valid tokamak-appchain metadata
✓ accepts valid thanos metadata in appchain-data
✓ rejects missing required field: name
✓ rejects missing required field: operator.address
✓ rejects invalid stackType
✓ rejects invalid status enum
✓ rejects invalid address format (uppercase)
✓ rejects invalid URL format
✓ rejects erc20 nativeToken without l1Address
✓ requires OnChainProposer for tokamak-appchain stack
✓ requires SystemConfig for thanos stack
✓ accepts unknown stack type with any l1Contracts
✓ validates optional fields when present
```

#### Contract Validation Tests (mocked RPC)
```
✓ tokamak-appchain: verifies OnChainProposer.owner()
✓ tokamak-appchain: follows Timelock.admin() chain
✓ tokamak-appchain: rejects when signer != owner
✓ thanos: verifies SystemConfig.unsafeBlockSigner()
✓ rejects when contract not deployed (code = 0x)
✓ handles L1 RPC timeout gracefully
✓ handles L2 RPC timeout (non-blocking for update)
✓ validates l2ChainId matches rpcUrl response
```

#### Signature Validation Tests
```
✓ verifies valid appchain signature (new format)
✓ rejects signature from wrong signer
✓ rejects expired signature (> 24h)
✓ rejects future timestamp
✓ rejects timestamp mismatch with createdAt
✓ uses createdAt timestamp for register, lastUpdated for update
✓ distinguishes legacy format from appchain format by path
```

#### Immutable Fields Tests
```
✓ allows changing description on update
✓ rejects changing l1ChainId on update
✓ rejects changing stackType on update
✓ rejects changing createdAt on update
✓ rejects changing OnChainProposer address on update
```

#### PR Title Tests
```
✓ parses [Appchain] title correctly
✓ parses [Update] title for appchain-data
✓ rejects [Rollup] title for appchain-data files
✓ validates l1ChainId consistency
✓ validates stackType consistency
✓ validates contract address consistency
✓ validates name consistency
```

### 5-2. Integration Tests

**File:** `tests/appchain-integration.test.ts`

```
✓ full validation pass: valid tokamak-appchain register
✓ full validation pass: valid thanos register in appchain-data
✓ full validation pass: valid update operation
✓ full validation fail: schema + signature errors combined
✓ validates example-tokamak-appchain.json passes schema validation
```

### 5-3. Test Fixtures

```
tests/fixtures/
├── valid-tokamak-appchain.json        # passes all validation
├── valid-thanos-appchain.json         # passes all validation
├── invalid-missing-name.json          # missing required field
├── invalid-wrong-stack.json           # stackType doesn't match path
├── invalid-uppercase-address.json     # non-lowercase address
├── invalid-expired-signature.json     # signature > 24h old
└── invalid-immutable-change.json      # changed l1ChainId on update
```

---

## 6. Constants & ABIs to Add

### `validators/constants.ts` additions:

```typescript
// OnChainProposer ABI (tokamak-appchain)
export const ON_CHAIN_PROPOSER_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

// Timelock ABI (tokamak-appchain)
export const TIMELOCK_ABI = [
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

// Supported stack types
export const SUPPORTED_STACK_TYPES = [
  "tokamak-appchain",
  "tokamak-private-app-channel",
  "thanos",
  "py-ethclient",
] as const;

// Identity contract field per stack type
export const IDENTITY_CONTRACT_FIELDS: Record<string, string> = {
  "tokamak-appchain": "OnChainProposer",
  "thanos": "SystemConfig",
  // TBD for others
};

// L1 RPC URLs by chain ID (extensible via env vars)
export const L1_RPC_BY_CHAIN_ID: Record<number, string> = {
  1: process.env.L1_RPC_1 || "https://ethereum-rpc.publicnode.com",
  11155111: process.env.L1_RPC_11155111 || "https://ethereum-sepolia-rpc.publicnode.com",
  17000: process.env.L1_RPC_17000 || "https://ethereum-holesky-rpc.publicnode.com",
  42161: process.env.L1_RPC_42161 || "https://arb1.arbitrum.io/rpc",
};

export function getL1RpcUrl(chainId: number): string {
  const envKey = `L1_RPC_${chainId}`;
  const envUrl = process.env[envKey];
  if (envUrl) return envUrl;
  const known = L1_RPC_BY_CHAIN_ID[chainId];
  if (known) return known;
  throw new Error(
    `No L1 RPC URL for chain ID ${chainId}. Set ${envKey} environment variable.`
  );
}
```

---

## 7. File Change Summary

### New files (8):

| File | Purpose |
|------|---------|
| `schemas/tokamak-appchain-metadata.ts` | TypeScript type definitions |
| `schemas/example-tokamak-appchain.json` | Example metadata |
| `schemas/example-thanos-appchain.json` | Example metadata (thanos in new dir) |
| `validators/appchain-schema-validator.ts` | Schema validation |
| `validators/appchain-contract-validator.ts` | On-chain verification |
| `scripts/validate-appchain.ts` | CLI entry point |
| `docs/appchain-registration-guide.md` | User guide |
| `tokamak-appchain-data/.gitkeep` | Directory creation |

### Modified files (9):

| File | Changes |
|------|---------|
| `validators/rollup-validator.ts` | Add `validateMetadata()` router, `validateAppchainMetadata()` |
| `validators/signature-validator.ts` | Add new message format support |
| `validators/network-validator.ts` | Add numeric chain ID + stack type path support |
| `validators/file-validator.ts` | Add appchain path pattern, stack-specific immutables |
| `validators/timestamp-validator.ts` | Update GitHub Raw URL pattern for new paths |
| `validators/constants.ts` | Add ABIs, stack types, L1 RPC by chain ID |
| `.github/workflows/validate-rollup-metadata.yml` | Add path trigger, type detection, routing |
| `package.json` | Add `validate:appchain` script |
| `README.md` | Document new directory and registration flow |

### Unchanged files:

| File | Reason |
|------|--------|
| `validators/schema-validator.ts` | Used only for `data/` paths — no changes |
| `validators/contract-validator.ts` | Used only for `data/` paths — no changes |
| `validators/address-validator.ts` | Generic, works for both paths |
| All files under `data/` | Completely untouched |
