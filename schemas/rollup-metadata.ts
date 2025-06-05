/**
 * L2 rollup metadata type definitions
 */

// Currently supported by Tokamak SDK: optimistic (Thanos)
// Future support planned: zk, sovereign
export type RollupType = 'optimistic' | 'zk' | 'sovereign';
export type RollupStatus = 'active' | 'inactive' | 'maintenance' | 'deprecated' | 'shutdown';

/**
 * Validation constraints for rollup metadata
 */
export interface ValidationRules {
  // Signature validation
  signatureValidityPeriod: 86400; // 24 hours in seconds

  // Update-specific validation
  updateTimestampWindow: 3600; // 1 hour in seconds - lastUpdated must be within this window

  // Timestamp ordering
  updateTimestampMustBeAfterPrevious: true; // For updates, new lastUpdated > existing lastUpdated

  // Immutable fields (cannot be changed during updates)
  immutableFields: [
    'l1ChainId',
    'l2ChainId',
    'l1Contracts.systemConfig',
    'rollupType',
    'stack.name',
    'createdAt'
  ];
}

export interface L2RollupMetadata {
  // Basic information
  l1ChainId: number; // L1 chain ID (1: mainnet, 11155111: sepolia, etc.)
  l2ChainId: number; // L2 chain ID (rollup's own chain ID)
  name: string;
  description: string;
  logo?: string;
  website?: string;

  // Rollup type and technology stack
  rollupType: RollupType;
  stack: {
    name: string; // Currently: 'thanos' | Future: 'zk-evm', 'polygon-cdk', etc.
    version: string;
    // ZK Rollup related fields (for future use)
    zkProofSystem?: 'plonk' | 'stark' | 'groth16' | 'fflonk';
  };

  // Network information
  rpcUrl: string;
  wsUrl?: string;

  // Native token configuration (Thanos L2 feature)
  nativeToken: {
    type: 'eth' | 'erc20'; // ETH or custom ERC20
    symbol: string; // ETH, TON, USDC, etc.
    name: string; // Ethereum, Tokamak Network Token, etc.
    decimals: number; // 18 (ETH), 18 (TON), 6 (USDC), etc.

    // L1 contract address for ERC20 type
    l1Address?: string; // Required when type is 'erc20'

    // Additional token information
    logoUrl?: string;
    coingeckoId?: string; // For price information
  };

  // Operational status
  status: RollupStatus;
  createdAt: string; // ISO 8601 format - initial registration time (immutable after creation)
  lastUpdated: string; // ISO 8601 format - last update time
                      // For updates: must be within 1 hour of current time and after previous lastUpdated

  // L2 shutdown related information
  shutdown?: {
    isPlanned: boolean;
    plannedShutdownDate?: string; // ISO 8601 format
    actualShutdownDate?: string; // ISO 8601 format
    reason: string; // Shutdown reason
    migrationInfo?: {
      targetChain?: string;
      migrationDeadline?: string;
      migrationGuide?: string;
    };
    stakingImpact?: {
      candidateRemovalDate?: string;
      finalRewardDate?: string;
      penaltyApplied?: boolean;
    };
  };

  // L1 contract information (varies by rollup type)
  l1Contracts: {
    // 🔑 SystemConfig (Core for all Tokamak rollups - referred to as "RollupConfig" in Staking)
    systemConfig: string; // Required: used as filename, Staking V2 identifier

    // === Optimistic Rollup (Thanos) contracts ===
    addressManager?: string;
    l1CrossDomainMessenger?: string;
    l1StandardBridge?: string;
    l1ERC721Bridge?: string;
    optimismPortal?: string;
    l2OutputOracle?: string;
    disputeGameFactory?: string;
    optimismMintableERC20Factory?: string;
    optimismMintableERC721Factory?: string;
    superchainConfig?: string;
    l1UsdcBridge?: string;
    l1Usdc?: string;

    // === Future ZK Rollup contracts ===
    zkVerifier?: string;
    rollupProcessor?: string;
    exitRoot?: string;
    globalExitRootManager?: string;
    polygonDataCommittee?: string;

    // === Common/Other contracts ===
    rollupManager?: string;
    proxyAdmin?: string;

    // Extensible structure
    [contractName: string]: string | undefined;
  };

  // L2 contract information (varies by rollup type)
  l2Contracts: {
    nativeToken: string;  // 0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000

    // === Optimistic Rollup (Thanos) contracts ===
    l2CrossDomainMessenger?: string;
    l2StandardBridge?: string;
    l2ERC721Bridge?: string;
    gasPriceOracle?: string;
    l1Block?: string;
    l2ToL1MessagePasser?: string;
    l1FeeVault?: string;
    sequencerFeeVault?: string;
    baseFeeVault?: string;
    l2UsdcBridge?: string;
    l2Usdc?: string;

    // === ETH wrapping contract when native token is ERC20 ===
    // When L2 native token is ERC20, ETH becomes an ERC20 contract
    wrappedETH?: string; // ETH wrapped as ERC20 address (when native token is ERC20)

    // === Future ZK Rollup contracts ===
    polygonZkEVMBridge?: string;
    polygonZkEVMGlobalExitRoot?: string;

    // === Common contracts ===
    multicall?: string;
    create2Deployer?: string;

    // Extensible structure
    [contractName: string]: string | undefined;
  };

  // Bridge information
  bridges: Array<{
    name: string;
    type: 'native' | 'canonical' | 'third-party';
    url: string;
    status?: 'active' | 'inactive' | 'maintenance' | 'none'; // Operational status of the bridge
    supportedTokens: Array<{
      symbol: string;
      l1Address: string; // L1 token address (0x0000000000000000000000000000000000000000 for ETH)
      l2Address: string; // L2 token address (ERC20 address if native token is ERC20)
      decimals: number;
      isNativeToken?: boolean; // Whether it's L2 native token
      isWrappedETH?: boolean; // Whether ETH is wrapped as ERC20 token
    }>;
  }>;

  // Explorer information
  explorers: Array<{
    name: string;
    url: string;
    type: 'blockscout' | 'etherscan' | 'custom';
    status?: 'active' | 'inactive' | 'maintenance' | 'none'; // Operational status of the explorer
    apiUrl?: string;
  }>;

  // L2 support resources and contact information
  supportResources?: {
    statusPageUrl?: string; // Rollup status page (e.g., status.example-l2.com)
    supportContactUrl?: string; // Support contact (Discord, Telegram, etc.)
    documentationUrl?: string; // Official documentation
    communityUrl?: string; // Community chat/forum
    helpCenterUrl?: string; // Help center or FAQ
    announcementUrl?: string; // Announcements channel
  };

  // Sequencer/Operator information (role varies by rollup type)
  sequencer: {
    address: string; // Optimistic: sequencer, ZK: aggregator/sequencer

    // Optimistic Rollup related
    batcherAddress?: string;
    proposerAddress?: string;

    // Future ZK Rollup related
    aggregatorAddress?: string;
    trustedSequencer?: string;
  };

  // Tokamak staking related information (registration status tracking and detailed information)
  staking: {
    isCandidate: boolean; // Whether registered as candidate in Staking V2 (registered through separate verification contract)
    candidateRegisteredAt?: string; // Candidate registration time (ISO 8601 format)
    candidateStatus?: 'not_registered' | 'pending' | 'active' | 'suspended' | 'terminated';

    // Registration transaction details
    registrationTxHash?: string; // Transaction hash where SystemConfig was registered to staking
    candidateAddress?: string; // Generated candidate address after registration

    // 💡 Note: Staking V2 refers to systemConfig address as "RollupConfig"
    rollupConfigAddress?: string; // Same as systemConfig - alias for compatibility

    // Name registered in staking service (may differ from metadata name)
    stakingServiceName?: string; // Name displayed in staking UI

  };

  // Network configuration (varies by rollup type)
  networkConfig: {
    blockTime: number; // seconds
    gasLimit: string;
    baseFeePerGas?: string;
    priorityFeePerGas?: string;

    // === Optimistic Rollup batch/submission settings ===
    batchSubmissionFrequency?: number; // seconds - batch submission interval (default: 1440s)
    outputRootFrequency?: number; // seconds - output root submission interval (default: 240s)

    // Future ZK Rollup specific settings
    batchTimeout?: number;
    trustedAggregatorTimeout?: number;
    forceBatchTimeout?: number;
  };

  // Withdrawal related configuration (newly added)
  withdrawalConfig?: {
    // Challenge period (dispute period)
    challengePeriod: number; // seconds - default: 120s (2 minutes)

    // Expected withdrawal delay time (calculated value)
    expectedWithdrawalDelay: number; // seconds - Max(batchSubmissionFrequency, outputRootFrequency) + challengePeriod

    // Withdrawal delay factor monitoring information
    monitoringInfo: {
      l2OutputOracleAddress: string; // For checking OutputProposed events (core of withdrawal monitoring)
      outputProposedEventTopic?: string; // Event topic hash (default is standard OutputProposed event)
    };
  };

  // Metadata information
  metadata: {
    version: string; // Metadata schema version
    signature: string; // Sequencer's signature with timestamp-based validation
                      // Message format: "Tokamak Rollup Registry\nL1 Chain ID: {l1ChainId}\nL2 Chain ID: {l2ChainId}\nOperation: {register|update}\nSystemConfig: {address}\nTimestamp: {unixTimestamp}"
                      // Validation: 24-hour expiry from timestamp, must be signed by on-chain sequencer
                      // Replay protection: enforced through lastUpdated timestamp validation for updates
    signedBy: string; // Sequencer address that signed (must match SystemConfig.unsafeBlockSigner())
  };
}