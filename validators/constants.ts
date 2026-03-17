// SystemConfig contract ABI (unsafeBlockSigner function only)
export const SYSTEM_CONFIG_ABI = [
  {
    'inputs': [],
    'name': 'unsafeBlockSigner',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [],
    'name': 'nativeTokenAddress',
    'outputs': [
      {
        'internalType': 'address',
        'name': 'addr_',
        'type': 'address',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
];

// Layer2ManagerProxy ABI for registerCandidateAddOn function and event
export const LAYER2_MANAGER_ABI = [
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'rollupConfig', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' },
      { 'internalType': 'bool', 'name': 'flagTon', 'type': 'bool' },
      { 'internalType': 'string', 'name': 'memo', 'type': 'string' },
    ],
    'name': 'registerCandidateAddOn',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function',
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'address', 'name': 'rollupConfig', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'wtonAmount', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'string', 'name': 'memo', 'type': 'string' },
      { 'indexed': false, 'internalType': 'address', 'name': 'operator', 'type': 'address' },
      { 'indexed': false, 'internalType': 'address', 'name': 'candidateAddOn', 'type': 'address' },
    ],
    'name': 'RegisteredCandidateAddOn',
    'type': 'event',
  },
];

// OnChainProposer contract ABI (owner function — for tokamak-appchain stack)
export const ON_CHAIN_PROPOSER_ABI = [
  {
    'inputs': [],
    'name': 'owner',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address',
      },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
];

// Timelock contract ABI (AccessControlEnumerable — for tokamak-appchain ownership)
export const TIMELOCK_ABI = [
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'internalType': 'address', 'name': 'account', 'type': 'address' },
    ],
    'name': 'hasRole',
    'outputs': [
      { 'internalType': 'bool', 'name': '', 'type': 'bool' },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'internalType': 'uint256', 'name': 'index', 'type': 'uint256' },
    ],
    'name': 'getRoleMember',
    'outputs': [
      { 'internalType': 'address', 'name': '', 'type': 'address' },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
    ],
    'name': 'getRoleMemberCount',
    'outputs': [
      { 'internalType': 'uint256', 'name': '', 'type': 'uint256' },
    ],
    'stateMutability': 'view',
    'type': 'function',
  },
];

// SECURITY_COUNCIL role hash: keccak256("SECURITY_COUNCIL")
export const SECURITY_COUNCIL_ROLE = '0x43f2f87353a389b882a4a57f769726e87f292d6a40a03d75d5beeed3bc6b936f';

// GitHub raw API base URL for remote file fetching
export const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com/tokamak-network/tokamak-rollup-metadata-repository/refs/heads/main/';

// Public RPC Provider URLs by network
export const PUBLIC_RPC_PROVIDERS = {
  mainnet: 'https://ethereum-rpc.publicnode.com',
  sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
  goerli: 'https://ethereum-goerli-rpc.publicnode.com',
  holesky: 'https://ethereum-holesky-rpc.publicnode.com',
} as const;

// Network chain ID mappings
export const NETWORK_CHAIN_IDS = {
  mainnet: [1] as readonly number[], // Ethereum mainnet L1 only
  sepolia: [11155111] as readonly number[], // Sepolia testnet
  goerli: [5] as readonly number[], // Goerli testnet (deprecated)
  holesky: [17000] as readonly number[], // Holesky testnet
};

// Helper function to get RPC provider for chain ID
export function getRpcProviderForChainId(chainId: number): string {
  if (NETWORK_CHAIN_IDS.mainnet.includes(chainId)) {
    return PUBLIC_RPC_PROVIDERS.mainnet;
  }
  if (NETWORK_CHAIN_IDS.sepolia.includes(chainId)) {
    return PUBLIC_RPC_PROVIDERS.sepolia;
  }
  if (NETWORK_CHAIN_IDS.goerli.includes(chainId)) {
    return PUBLIC_RPC_PROVIDERS.goerli;
  }
  if (NETWORK_CHAIN_IDS.holesky.includes(chainId)) {
    return PUBLIC_RPC_PROVIDERS.holesky;
  }

  // Check environment variable: L1_RPC_{chainId}
  const envKey = `L1_RPC_${chainId}`;
  const customUrl = process.env[envKey];
  if (customUrl) {
    return customUrl;
  }

  throw new Error(
    `No RPC provider configured for chain ID ${chainId}. Set L1_RPC_${chainId} env var.`
  );
}

// Helper function to get RPC provider for network name
export function getRpcProviderForNetwork(network: string): string {
  const normalizedNetwork = network.toLowerCase() as keyof typeof PUBLIC_RPC_PROVIDERS;
  return PUBLIC_RPC_PROVIDERS[normalizedNetwork] || PUBLIC_RPC_PROVIDERS.mainnet;
}