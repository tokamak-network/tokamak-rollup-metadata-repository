# tokamak-appchain-data: Design & Implementation Plan

## Overview

Extend the metadata repository to support **all Tokamak ecosystem appchains** beyond the existing Thanos/OP Stack rollups. A new `tokamak-appchain-data/` directory will house metadata for multiple stack types (Tokamak Appchain, Tokamak Private App Channel, Thanos, py-ethclient, etc.) organized by L1 chain ID and stack type.

---

## Current State

```
data/
├── mainnet/                        # L1: Ethereum Mainnet
│   └── {systemConfigAddress}.json  # Thanos rollups
└── sepolia/                        # L1: Sepolia
    └── {systemConfigAddress}.json  # 40+ Thanos rollups
```

- **Stack:** Thanos only (OP Stack optimistic rollup)
- **Identity contract:** `SystemConfig` address
- **Folder key:** Network name (mainnet/sepolia)
- **Validation:** Schema + on-chain `SystemConfig.unsafeBlockSigner()` + sequencer signature
- **CI:** Auto-validate + auto-merge on PR

---

## Target State

```
data/                                        # UNCHANGED: Existing Thanos rollups
├── mainnet/
└── sepolia/

tokamak-appchain-data/                       # NEW: All Tokamak ecosystem appchains
├── 1/                                       # L1 Chain ID: Ethereum Mainnet
│   ├── tokamak-appchain/
│   │   └── {OnChainProposer}.json
│   ├── tokamak-private-app-channel/
│   │   └── {identityContract}.json
│   ├── thanos/
│   │   └── {SystemConfig}.json
│   └── py-ethclient/
│       └── {identityContract}.json
├── 11155111/                                # L1 Chain ID: Sepolia
│   ├── tokamak-appchain/
│   │   └── {OnChainProposer}.json
│   ├── tokamak-private-app-channel/
│   │   └── {identityContract}.json
│   ├── thanos/
│   │   └── {SystemConfig}.json
│   └── py-ethclient/
│       └── {identityContract}.json
├── 17000/                                   # L1 Chain ID: Holesky
│   └── ...
└── {any_chain_id}/                          # Any L1 (non-Ethereum, L3, etc.)
    └── {stack_type}/
        └── {identityContract}.json
```

**Path convention:**
```
tokamak-appchain-data/{l1ChainId}/{stackType}/{identityContract}.json
```

---

## What Needs to Change

### 1. Schema: New `TokamakAppchainMetadata` type

The existing `L2RollupMetadata` is Thanos/OP Stack specific. We need a new schema for `tokamak-appchain-data/`.

#### Required Changes in `schemas/`

**New file: `schemas/tokamak-appchain-metadata.ts`**

```typescript
export type StackType =
  | "tokamak-appchain"
  | "tokamak-private-app-channel"
  | "thanos"
  | "py-ethclient";

export type AppchainStatus = "active" | "inactive" | "maintenance" | "deprecated" | "shutdown";

export interface TokamakAppchainMetadata {
  // Basic information
  l1ChainId: number;
  l2ChainId: number;
  name: string;
  description: string;
  logo?: string;
  website?: string;

  // Stack type
  stackType: StackType;
  stackVersion?: string;

  // Network
  rpcUrl: string;
  wsUrl?: string;

  // Status
  status: AppchainStatus;
  createdAt: string;         // ISO 8601
  lastUpdated: string;       // ISO 8601

  // Native token
  nativeToken: {
    type: "eth" | "erc20";
    symbol: string;
    name: string;
    decimals: number;
    l1Address?: string;      // Required when type is "erc20"
  };

  // L1 Contracts — varies by stack type
  l1Contracts: TokamakAppchainL1Contracts | ThanosL1Contracts | GenericL1Contracts;

  // L2 Contracts — varies by stack type
  l2Contracts?: Record<string, string>;

  // Services
  bridges?: Array<{
    name: string;
    type: "native" | "canonical" | "third-party";
    url: string;
    status?: "active" | "inactive" | "maintenance";
    supportedTokens?: Array<{
      symbol: string;
      l1Address: string;
      l2Address: string;
      decimals: number;
    }>;
  }>;

  explorers?: Array<{
    name: string;
    url: string;
    type: "blockscout" | "etherscan" | "custom";
    status?: "active" | "inactive" | "maintenance";
  }>;

  // Operator
  operator: {
    address: string;           // Main operator address
    sequencerAddress?: string;
    proposerAddress?: string;
    batcherAddress?: string;
  };

  // Network config
  networkConfig?: {
    blockTime?: number;
    gasLimit?: string;
    proofSystem?: "sp1" | "risc0" | "plonk" | "stark" | "groth16";
  };

  // Support resources
  supportResources?: {
    statusPageUrl?: string;
    supportContactUrl?: string;
    documentationUrl?: string;
    communityUrl?: string;
  };

  // Metadata & auth
  metadata: {
    version: string;
    signature: string;
    signedBy: string;
  };
}

// Tokamak Appchain (ethrex-based) L1 contracts
interface TokamakAppchainL1Contracts {
  OnChainProposer: string;     // Identity contract (= filename)
  CommonBridge: string;
  Timelock?: string;
  SP1Verifier?: string;
  GuestProgramRegistry?: string;
  [contractName: string]: string | undefined;
}

// Thanos (OP Stack) L1 contracts — same as existing schema
interface ThanosL1Contracts {
  SystemConfig: string;        // Identity contract (= filename)
  L1StandardBridge?: string;
  OptimismPortal?: string;
  L2OutputOracle?: string;
  DisputeGameFactory?: string;
  [contractName: string]: string | undefined;
}

// Generic L1 contracts for future stacks
interface GenericL1Contracts {
  [contractName: string]: string | undefined;
}
```

**New file: `schemas/example-tokamak-appchain.json`**

```json
{
  "l1ChainId": 11155111,
  "l2ChainId": 12345,
  "name": "My Tokamak Appchain",
  "description": "A ZK rollup built on Tokamak Appchain stack",
  "website": "https://my-appchain.example.com",

  "stackType": "tokamak-appchain",
  "stackVersion": "1.0.0",

  "rpcUrl": "https://rpc.my-appchain.example.com",

  "status": "active",
  "createdAt": "2026-03-13T00:00:00Z",
  "lastUpdated": "2026-03-13T00:00:00Z",

  "nativeToken": {
    "type": "eth",
    "symbol": "ETH",
    "name": "Ethereum",
    "decimals": 18
  },

  "l1Contracts": {
    "OnChainProposer": "0xabc...def",
    "CommonBridge": "0x123...456",
    "Timelock": "0x789...abc",
    "SP1Verifier": "0xdef...123",
    "GuestProgramRegistry": "0x456...789"
  },

  "bridges": [
    {
      "name": "Tokamak Bridge",
      "type": "native",
      "url": "https://bridge.my-appchain.example.com",
      "status": "active"
    }
  ],

  "explorers": [
    {
      "name": "Appchain Explorer",
      "url": "https://explorer.my-appchain.example.com",
      "type": "blockscout",
      "status": "active"
    }
  ],

  "operator": {
    "address": "0xabcdef1234567890abcdef1234567890abcdef12"
  },

  "networkConfig": {
    "blockTime": 2,
    "gasLimit": "30000000",
    "proofSystem": "sp1"
  },

  "metadata": {
    "version": "1.0.0",
    "signature": "0x...",
    "signedBy": "0xabcdef1234567890abcdef1234567890abcdef12"
  }
}
```

---

### 2. Validators: Stack-Aware Validation

#### Changes to existing validators

| File | Change | Description |
|------|--------|-------------|
| `validators/rollup-validator.ts` | **Major** | Add stack-aware orchestration — detect `tokamak-appchain-data/` path, select correct schema + contract validator |
| `validators/schema-validator.ts` | **Major** | Support both `L2RollupMetadata` (data/) and `TokamakAppchainMetadata` (tokamak-appchain-data/) schemas |
| `validators/contract-validator.ts` | **Major** | Stack-specific contract verification (see below) |
| `validators/signature-validator.ts` | **Moderate** | New message format for tokamak-appchain-data (different signed fields) |
| `validators/network-validator.ts` | **Moderate** | Support L1 chain ID folder naming (numeric vs network name) |
| `validators/file-validator.ts` | **Moderate** | New path pattern, stack-type-specific immutable fields |
| `validators/timestamp-validator.ts` | **Minor** | Same logic, different file path pattern for GitHub Raw URL |
| `validators/constants.ts` | **Minor** | Add Tokamak Appchain contract ABIs |

#### Stack-specific contract verification

```
Stack: tokamak-appchain
  1. eth_getCode(OnChainProposer) on L1 → must exist
  2. OnChainProposer.owner() → returns Timelock address
  3. Timelock.admin() OR contract deployer → must match metadata.signedBy
  4. eth_chainId on L2 rpcUrl → must match l2ChainId

Stack: thanos (in tokamak-appchain-data/)
  1. eth_getCode(SystemConfig) on L1 → must exist
  2. SystemConfig.unsafeBlockSigner() → must match metadata.signedBy
  3. eth_chainId on L2 rpcUrl → must match l2ChainId

Stack: tokamak-private-app-channel
  TBD — define identity contract and verification method

Stack: py-ethclient
  TBD — define identity contract and verification method
```

#### Signature message format for tokamak-appchain-data

```
Tokamak Appchain Registry
L1 Chain ID: {l1ChainId}
L2 Chain ID: {l2ChainId}
Stack: {stackType}
Operation: {register|update}
Contract: {identityContractAddress}
Timestamp: {unixTimestamp}
```

Key differences from existing `data/` message:
- "Tokamak Appchain Registry" (not "Tokamak Rollup Registry")
- Added `Stack:` field
- `Contract:` instead of `SystemConfig:` (generic for any identity contract)

---

### 3. CI/CD Pipeline

#### Changes to `.github/workflows/validate-rollup-metadata.yml`

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - 'data/**/*.json'                      # Existing
      - 'tokamak-appchain-data/**/*.json'      # NEW

# ... existing steps ...

# NEW: Detect which directory the file belongs to
- name: Detect metadata type
  run: |
    if [[ "$FILE" == tokamak-appchain-data/* ]]; then
      echo "METADATA_TYPE=tokamak-appchain" >> $GITHUB_ENV
      # Parse: tokamak-appchain-data/{l1ChainId}/{stackType}/{contract}.json
      L1_CHAIN_ID=$(echo "$FILE" | cut -d'/' -f2)
      STACK_TYPE=$(echo "$FILE" | cut -d'/' -f3)
      CONTRACT=$(basename "$FILE" .json)
      echo "L1_CHAIN_ID=$L1_CHAIN_ID" >> $GITHUB_ENV
      echo "STACK_TYPE=$STACK_TYPE" >> $GITHUB_ENV
      echo "CONTRACT=$CONTRACT" >> $GITHUB_ENV
    else
      echo "METADATA_TYPE=legacy" >> $GITHUB_ENV
    fi
```

#### PR Title Format (new)

```
Existing:  [Rollup] sepolia 0xabc...def - MyRollup
New:       [Appchain] 11155111/tokamak-appchain 0xabc...def - MyAppchain
Update:    [Update] 11155111/tokamak-appchain 0xabc...def - MyAppchain
```

---

### 4. New Files to Create

| File | Purpose |
|------|---------|
| `schemas/tokamak-appchain-metadata.ts` | TypeScript type definitions for new schema |
| `schemas/example-tokamak-appchain.json` | Example metadata for tokamak-appchain stack |
| `schemas/example-thanos-appchain.json` | Example metadata for thanos in new directory |
| `validators/appchain-contract-validator.ts` | Stack-specific contract verification |
| `validators/appchain-schema-validator.ts` | Schema validation for new metadata type |
| `scripts/validate-appchain.ts` | CLI validation for tokamak-appchain-data files |
| `tokamak-appchain-data/.gitkeep` | Create directory structure |
| `docs/appchain-registration-guide.md` | Registration guide for new directory |

### 5. Files to Modify

| File | Change |
|------|--------|
| `validators/rollup-validator.ts` | Add routing logic for tokamak-appchain-data paths |
| `validators/signature-validator.ts` | Support new message format |
| `validators/network-validator.ts` | Support numeric chain ID folders + stack type folders |
| `validators/file-validator.ts` | New path pattern, stack-specific immutable fields |
| `validators/constants.ts` | Add OnChainProposer ABI, Timelock ABI |
| `.github/workflows/validate-rollup-metadata.yml` | Add tokamak-appchain-data path trigger + routing |
| `package.json` | Add `validate:appchain` script |
| `README.md` | Document new directory structure and registration flow |
| `src/utils/rpc-config.ts` | Support arbitrary L1 chain IDs (not just mainnet/sepolia) |

---

## Implementation Plan

### Phase 1: Schema & Directory Structure

| # | Task | Effort |
|---|------|--------|
| 1 | Create `tokamak-appchain-data/` directory with `.gitkeep` | S |
| 2 | Write `schemas/tokamak-appchain-metadata.ts` — new type definitions | M |
| 3 | Create example JSON files for each stack type | S |
| 4 | Update `src/utils/rpc-config.ts` — support arbitrary L1 chain IDs | S |

### Phase 2: Validators

| # | Task | Effort |
|---|------|--------|
| 5 | Create `validators/appchain-schema-validator.ts` — JSON schema for new type | M |
| 6 | Create `validators/appchain-contract-validator.ts` — stack-specific on-chain checks | L |
| 7 | Update `validators/signature-validator.ts` — new message format | M |
| 8 | Update `validators/network-validator.ts` — numeric folder + stack folder support | M |
| 9 | Update `validators/file-validator.ts` — new path pattern + immutable fields | M |
| 10 | Update `validators/rollup-validator.ts` — routing between legacy and new paths | M |
| 11 | Update `validators/constants.ts` — add contract ABIs | S |

### Phase 3: CI/CD & Scripts

| # | Task | Effort |
|---|------|--------|
| 12 | Create `scripts/validate-appchain.ts` — CLI for new metadata type | M |
| 13 | Update CI workflow — add path triggers, detect metadata type, route validation | L |
| 14 | Update PR title format validation for new `[Appchain]` prefix | S |
| 15 | Add tests for new validators | M |

### Phase 4: Documentation

| # | Task | Effort |
|---|------|--------|
| 16 | Create `docs/appchain-registration-guide.md` | M |
| 17 | Update `README.md` — new directory structure, stack types, registration flow | M |
| 18 | Update `docs/file-naming.md` — new path convention | S |
| 19 | Update `.github/pull_request_template.md` — add appchain option | S |

---

## Backward Compatibility

| Aspect | Guarantee |
|--------|-----------|
| `data/` directory | **Untouched** — all existing rollups continue to work |
| Existing validators | **Unchanged** for `data/` paths — new logic only for `tokamak-appchain-data/` |
| CI workflow | **Additive** — existing PR paths still trigger same validation |
| Schema | **New file** — `L2RollupMetadata` type unchanged |
| Tests | **Extended** — existing tests pass, new tests added |

---

## RPC Configuration for Arbitrary L1 Chains

Current `rpc-config.ts` only supports mainnet and sepolia. Need to support any L1 chain ID.

```typescript
// Current
const RPC_URLS: Record<string, string> = {
  mainnet: "https://...",
  sepolia: "https://...",
};

// New: support any chain ID
const L1_RPC_URLS: Record<number, string> = {
  1: process.env.L1_RPC_MAINNET || "https://eth.llamarpc.com",
  11155111: process.env.L1_RPC_SEPOLIA || "https://rpc.sepolia.org",
  17000: process.env.L1_RPC_HOLESKY || "https://rpc.holesky.ethpandaops.io",
  42161: process.env.L1_RPC_ARBITRUM || "https://arb1.arbitrum.io/rpc",
  // Fallback: use metadata's rpcUrl or env var L1_RPC_{chainId}
};

function getL1RpcUrl(chainId: number): string {
  return L1_RPC_URLS[chainId]
    || process.env[`L1_RPC_${chainId}`]
    || throw new Error(`No RPC URL configured for L1 chain ID ${chainId}`);
}
```

---

## Summary

| Item | Count |
|------|-------|
| New files to create | 8 |
| Existing files to modify | 9 |
| Total tasks | 19 |
| Backward compatibility breaks | 0 |
