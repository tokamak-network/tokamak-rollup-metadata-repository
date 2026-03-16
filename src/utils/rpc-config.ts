/**
 * RPC Configuration Utilities
 * Provides default public RPCs with environment variable fallbacks
 */

export interface RpcConfig {
  url: string;
  isCustom: boolean;
  network: string;
}

/**
 * Default public RPC endpoints
 */
const DEFAULT_RPC_URLS = {
  mainnet: 'https://eth.llamarpc.com',
  sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
  holesky: 'https://ethereum-holesky-rpc.publicnode.com'
} as const;

/**
 * Network configuration
 */
interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrls: string[];
  layer2ManagerProxy?: string; // Staking contract address
}

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrls: [
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.ankr.com/eth',
      'https://eth.drpc.org'
    ],
    layer2ManagerProxy: '0xD6Bf6B2b7553c8064Ba763AD6989829060FdFC1D'
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrls: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org',
      'https://sepolia.drpc.org'
    ],
    layer2ManagerProxy: '0x58B4C2FEf19f5CDdd944AadD8DC99cCC71bfeFDc'
  },
  holesky: {
    name: 'Holesky Testnet',
    chainId: 17000,
    rpcUrls: [
      'https://ethereum-holesky-rpc.publicnode.com',
    ],
  }
};

/**
 * Get RPC configuration for a network
 */
export function getRpcConfig(network: string): RpcConfig {
  const envKey = `${network.toUpperCase()}_RPC_URL`;
  const customUrl = process.env[envKey];

  if (customUrl) {
    return {
      url: customUrl,
      isCustom: true,
      network
    };
  }

  const defaultUrl = DEFAULT_RPC_URLS[network as keyof typeof DEFAULT_RPC_URLS];
  if (!defaultUrl) {
    throw new Error(`Unsupported network: ${network}`);
  }

  return {
    url: defaultUrl,
    isCustom: false,
    network
  };
}

/**
 * Get supported networks
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(DEFAULT_RPC_URLS);
}

/**
 * Check if network is supported
 */
export function isNetworkSupported(network: string): boolean {
  return network in DEFAULT_RPC_URLS;
}

/**
 * Get Layer2ManagerProxy address for the specified network
 */
export function getLayer2ManagerProxy(network: string): string | null {
  const config = NETWORK_CONFIGS[network];
  return config?.layer2ManagerProxy || null;
}

/**
 * Get network configuration by network name
 */
export function getNetworkConfig(network: string): NetworkConfig | null {
  return NETWORK_CONFIGS[network] || null;
}

// Chain ID → network name mapping
export const CHAIN_ID_TO_NETWORK: Record<number, string> = {
  1: 'mainnet',
  11155111: 'sepolia',
  17000: 'holesky',
};

/**
 * Get RPC URL for an arbitrary L1 chain ID.
 *
 * Resolution order:
 * 1. Environment variable: L1_RPC_{chainId} (e.g., L1_RPC_11155111)
 * 2. Known network config (mainnet, sepolia, holesky)
 * 3. Throws error if chain ID is unknown and no env var is set
 */
export function getRpcForChainId(chainId: number): RpcConfig {
  // 1. Check env var: L1_RPC_{chainId}
  const envKey = `L1_RPC_${chainId}`;
  const customUrl = process.env[envKey];
  if (customUrl) {
    return {
      url: customUrl,
      isCustom: true,
      network: `chain-${chainId}`,
    };
  }

  // 2. Check known networks
  const networkName = CHAIN_ID_TO_NETWORK[chainId];
  if (networkName) {
    const config = NETWORK_CONFIGS[networkName];
    if (config) {
      return {
        url: config.rpcUrls[0],
        isCustom: false,
        network: networkName,
      };
    }
  }

  throw new Error(
    `No RPC provider configured for L1 chain ID ${chainId}. ` +
    `Set the ${envKey} environment variable to provide one.`
  );
}