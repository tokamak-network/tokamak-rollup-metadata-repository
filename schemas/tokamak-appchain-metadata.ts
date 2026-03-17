/**
 * Tokamak Appchain metadata type definitions
 *
 * Directory structure: tokamak-appchain-data/{l1ChainId}/{stackType}/{identityContract}.json
 *
 * Supports multiple stack types across any L1 chain.
 * Each stack type defines its own identity contract (used as filename).
 */

// Supported stack types
export type StackType =
  | 'tokamak-appchain'
  | 'tokamak-private-app-channel'
  | 'py-ethclient';

// Stack display names (for UI rendering)
export const STACK_DISPLAY_NAMES: Record<StackType, string> = {
  'tokamak-appchain': 'Tokamak Appchain',
  'tokamak-private-app-channel': 'Tokamak Private App Channel',
  'py-ethclient': 'py-ethclient',
};

// Identity contract field per stack type (used as filename)
export const STACK_IDENTITY_CONTRACT: Record<StackType, string> = {
  'tokamak-appchain': 'Timelock',
  'tokamak-private-app-channel': 'IdentityContract', // TBD
  'py-ethclient': 'IdentityContract', // TBD
};

// Required l1Contracts fields per stack type
export const STACK_REQUIRED_L1_CONTRACTS: Record<StackType, string[]> = {
  'tokamak-appchain': ['Timelock', 'OnChainProposer'],
  'tokamak-private-app-channel': [], // TBD
  'py-ethclient': [], // TBD
};

export type RollupType = 'optimistic' | 'zk' | 'sovereign';
export type AppchainStatus = 'active' | 'inactive' | 'maintenance' | 'deprecated' | 'shutdown';

/**
 * Immutable fields — cannot be changed after initial registration
 */
export const APPCHAIN_IMMUTABLE_FIELDS = [
  'l1ChainId',
  'l2ChainId',
  'stackType',
  'createdAt',
  // Identity contract field is added dynamically based on stackType
];

/**
 * Returns the identity contract field name for a given stack type.
 * The identity contract address is used as the JSON filename.
 */
export function getIdentityContractField(stackType: string): string {
  const field = STACK_IDENTITY_CONTRACT[stackType as StackType];
  if (!field) {
    throw new Error(`Unknown stack type: ${stackType}`);
  }
  return field;
}

/**
 * Returns all immutable fields including the stack-specific identity contract.
 */
export function getImmutableFields(stackType: string): string[] {
  const field = getIdentityContractField(stackType);
  return [...APPCHAIN_IMMUTABLE_FIELDS, `l1Contracts.${field}`];
}

/**
 * Signature message format for appchain registration/update.
 *
 * Message:
 *   Tokamak Appchain Registry
 *   L1 Chain ID: {l1ChainId}
 *   L2 Chain ID: {l2ChainId}
 *   Stack: {stackType}
 *   Operation: {register|update}
 *   Contract: {identityContractAddress_lowercase}
 *   Timestamp: {unixTimestamp}
 *
 * Validation:
 * - 24-hour expiry from timestamp
 * - Must be signed by on-chain owner/sequencer
 * - Replay protection via lastUpdated timestamp ordering
 */

// --- L1 Contracts interfaces per stack ---

export interface TokamakAppchainL1Contracts {
  Timelock: string; // Identity contract (= filename)
  OnChainProposer: string;
  CommonBridge?: string;
  SP1Verifier?: string;
  GuestProgramRegistry?: string;
  [contractName: string]: string | undefined;
}

export interface GenericL1Contracts {
  [contractName: string]: string | undefined;
}

export type AppchainL1Contracts =
  | TokamakAppchainL1Contracts
  | GenericL1Contracts;

// --- Main metadata interface ---

export interface TokamakAppchainMetadata {
  // Basic information
  l1ChainId: number;
  l2ChainId: number;
  name: string;
  description: string;
  logo?: string;
  website?: string;

  // Stack type and version
  stackType: StackType;
  stackVersion?: string;

  // Rollup type
  rollupType: RollupType;

  // Network endpoints
  rpcUrl: string;
  wsUrl?: string;
  l1RpcUrl?: string; // L1 RPC URL for on-chain verification (required for non-standard L1 chains)

  // Native token configuration
  nativeToken: {
    type: 'eth' | 'erc20';
    symbol: string;
    name: string;
    decimals: number;
    l1Address?: string; // Required when type is 'erc20'
    logoUrl?: string;
    coingeckoId?: string;
  };

  // Operational status
  status: AppchainStatus;
  createdAt: string; // ISO 8601 — immutable after creation
  lastUpdated: string; // ISO 8601 — must be sequential on updates

  // L1 contracts (stack-specific)
  l1Contracts: AppchainL1Contracts;

  // L2 contracts (optional)
  l2Contracts?: {
    [contractName: string]: string | undefined;
  };

  // Operator information
  operator: {
    address: string; // Sequencer or deployer address
    batcherAddress?: string;
    proposerAddress?: string;
  };

  // Bridge information
  bridges?: Array<{
    name: string;
    type: 'native' | 'canonical' | 'third-party';
    url: string;
    status?: 'active' | 'inactive' | 'maintenance' | 'none';
    supportedTokens?: Array<{
      symbol: string;
      l1Address: string;
      l2Address: string;
      decimals: number;
      isNativeToken?: boolean;
      isWrappedETH?: boolean;
    }>;
  }>;

  // Explorer information
  explorers?: Array<{
    name: string;
    url: string;
    type: 'blockscout' | 'etherscan' | 'custom';
    status?: 'active' | 'inactive' | 'maintenance' | 'none';
    apiUrl?: string;
  }>;

  // Network configuration
  networkConfig?: {
    blockTime: number; // seconds
    gasLimit: string;
    baseFeePerGas?: string;
    priorityFeePerGas?: string;
  };

  // Support resources
  supportResources?: {
    statusPageUrl?: string;
    supportContactUrl?: string;
    documentationUrl?: string;
    communityUrl?: string;
    helpCenterUrl?: string;
    announcementUrl?: string;
    xUrl?: string;
    telegramUrl?: string;
    dashboardUrl?: string;
  };

  // Staking information (Tokamak Staking V2)
  staking?: {
    isCandidate: boolean;
    candidateRegisteredAt?: string;
    candidateStatus?: 'not_registered' | 'pending' | 'active' | 'suspended' | 'terminated';
    registrationTxHash?: string;
    candidateAddress?: string;
    rollupConfigAddress?: string;
    stakingServiceName?: string;
  };

  // Shutdown information
  shutdown?: {
    isPlanned: boolean;
    plannedShutdownDate?: string;
    actualShutdownDate?: string;
    reason: string;
    migrationInfo?: {
      targetChain?: string;
      migrationDeadline?: string;
      migrationGuide?: string;
    };
  };

  // Withdrawal configuration
  withdrawalConfig?: {
    challengePeriod: number;
    expectedWithdrawalDelay: number;
    monitoringInfo?: {
      l2OutputOracleAddress: string;
      outputProposedEventTopic?: string;
    };
    batchSubmissionFrequency?: number;
    outputRootFrequency?: number;
  };

  // Metadata & signature
  metadata: {
    version: string;
    signature: string; // 0x-prefixed, 130 hex chars
    signedBy: string; // Must match on-chain owner/sequencer
  };
}
