/**
 * Network validation module
 */
export class NetworkValidator {
  /**
   * Validate network and file path match
   */
  public validateNetworkPath(filepath: string, network: string): boolean {
    return filepath.includes(`/data/${network}/`);
  }

  /**
   * Extract network from file path
   */
  public extractNetworkFromPath(filepath: string): string | null {
    const networkMatch = filepath.match(/\/data\/(\w+)\//);
    return networkMatch ? networkMatch[1] : null;
  }

  /**
   * Validate network consistency between file path and chainId
   */
  public validateNetworkChainIdConsistency(network: string, chainId: number): { valid: boolean; error?: string } {
    const mainnetChainIds = [1]; // Ethereum mainnet
    const sepoliaChainIds = [11155111]; // Sepolia testnet

    // Add known L2 mainnet chainIds
    const knownMainnetL2ChainIds = [
      10, 42161, 137, 8453, // Optimism, Arbitrum, Polygon, Base
      324, 1101, 59144, // zkSync Era, Polygon zkEVM, Linea
    ];

    // Add known L2 testnet chainIds
    const knownTestnetL2ChainIds = [
      420, 421613, 80001, 84531, // Optimism Goerli, Arbitrum Goerli, Polygon Mumbai, Base Goerli
      280, 1442, 59140, // zkSync Era Testnet, Polygon zkEVM Testnet, Linea Testnet
    ];

    const isKnownMainnet = mainnetChainIds.includes(chainId) || knownMainnetL2ChainIds.includes(chainId);
    const isKnownTestnet = sepoliaChainIds.includes(chainId) || knownTestnetL2ChainIds.includes(chainId);

    if (network === 'mainnet') {
      // If it's a known testnet chainId, reject
      if (isKnownTestnet) {
        return {
          valid: false,
          error: `ChainId ${chainId} is a testnet chainId but file is in mainnet directory`,
        };
      }
      // Allow known mainnet or unknown/custom chainIds for mainnet
    } else if (network === 'sepolia') {
      // If it's a known mainnet chainId, reject
      if (isKnownMainnet) {
        return {
          valid: false,
          error: `ChainId ${chainId} is a mainnet chainId but file is in sepolia directory`,
        };
      }
      // Allow known testnet or unknown/custom chainIds for sepolia
    }

    return { valid: true };
  }

  /**
   * Parse and validate PR title
   * Required format: [Rollup] network 0x1234...abcd - L2 Name
   *                  [Update] network 0x1234...abcd - L2 Name
   */
  public parsePRTitle(title: string): {
    valid: boolean;
    network?: string;
    systemConfigAddress?: string;
    rollupName?: string;
    operation?: 'register' | 'update';
    error?: string;
  } {
    // Enforce specific format: [Operation] network SystemConfig_address - Rollup_name
    const formatMatch = title.match(/^\[(Rollup|Update)\]\s+(\w+)\s+(0[xX][a-fA-F0-9]{40})\s+-\s+(.+)$/);

    if (!formatMatch) {
      return {
        valid: false,
        error: 'PR title must follow format: [Rollup] network 0x1234...abcd - L2 Name or [Update] network 0x1234...abcd - L2 Name',
      };
    }

    const [, operationType, network, systemConfigAddress, rollupName] = formatMatch;
    const operation = operationType === 'Rollup' ? 'register' : 'update';

    // Validate network
    const validNetworks = ['mainnet', 'sepolia'];
    if (!validNetworks.includes(network)) {
      return {
        valid: false,
        error: `Invalid network: ${network}. Must be one of: ${validNetworks.join(', ')}`,
      };
    }

    // Validate rollup name is not empty after trimming
    const trimmedName = rollupName.trim();
    if (!trimmedName) {
      return {
        valid: false,
        error: 'Rollup name cannot be empty',
      };
    }

    return {
      valid: true,
      operation,
      network,
      systemConfigAddress,
      rollupName: trimmedName,
    };
  }

  // --- Appchain path support ---

  /**
   * Parse appchain-data file path.
   * Expected format: tokamak-appchain-data/{l1ChainId}/{stackType}/{identityContract}.json
   */
  public parseAppchainPath(filepath: string): {
    valid: boolean;
    l1ChainId?: number;
    stackType?: string;
    identityContract?: string;
    error?: string;
  } {
    const match = filepath.match(
      /(?:^|\/)tokamak-appchain-data\/(\d+)\/([a-z0-9-]+)\/(0x[a-f0-9]{40})\.json$/
    );

    if (!match) {
      // Check specific error cases for better messages
      const partialMatch = filepath.match(
        /(?:^|\/)tokamak-appchain-data\/([^/]+)\/([^/]+)\/([^/]+)\.json$/
      );
      if (partialMatch) {
        const [, chainIdPart, stackPart, filenamePart] = partialMatch;
        if (!/^\d+$/.test(chainIdPart)) {
          return { valid: false, error: `L1 chain ID folder must be a number, got: ${chainIdPart}` };
        }
        if (!/^0x[a-f0-9]{40}$/.test(filenamePart)) {
          return { valid: false, error: `Filename must be a valid lowercase Ethereum address, got: ${filenamePart}` };
        }
      }

      const missingStack = filepath.match(
        /(?:^|\/)tokamak-appchain-data\/\d+\/(0x[a-f0-9]{40})\.json$/
      );
      if (missingStack) {
        return { valid: false, error: 'Missing stack type folder in path' };
      }

      return { valid: false, error: `Invalid appchain-data path: ${filepath}` };
    }

    const validStackTypes = ['tokamak-appchain', 'tokamak-private-app-channel', 'thanos', 'py-ethclient'];
    if (!validStackTypes.includes(match[2])) {
      return { valid: false, error: `Unknown stack type: ${match[2]}` };
    }

    return {
      valid: true,
      l1ChainId: parseInt(match[1]),
      stackType: match[2],
      identityContract: match[3],
    };
  }

  /**
   * Check if a filepath is an appchain-data path.
   */
  public isAppchainPath(filepath: string): boolean {
    return filepath.includes('tokamak-appchain-data/');
  }

  /**
   * Parse and validate appchain PR title.
   * Format: [Appchain] {l1ChainId}/{stackType} 0x1234...abcd - Name
   *         [Update] {l1ChainId}/{stackType} 0x1234...abcd - Name
   */
  public parseAppchainPRTitle(title: string): {
    valid: boolean;
    operation?: 'register' | 'update';
    l1ChainId?: number;
    stackType?: string;
    identityContract?: string;
    appchainName?: string;
    error?: string;
  } {
    const formatMatch = title.match(
      /^\[(Appchain|Update)\]\s+(\d+)\/([\w-]+)\s+(0[xX][a-fA-F0-9]{40})\s+-\s+(.+)$/
    );

    if (!formatMatch) {
      return {
        valid: false,
        error: 'PR title must follow format: [Appchain] {chainId}/{stackType} 0x1234...abcd - Name or [Update] {chainId}/{stackType} 0x1234...abcd - Name',
      };
    }

    const [, operationType, chainId, stackType, identityContract, appchainName] = formatMatch;
    const operation = operationType === 'Appchain' ? 'register' : 'update';

    const trimmedName = appchainName.trim();
    if (!trimmedName) {
      return { valid: false, error: 'Appchain name cannot be empty' };
    }

    return {
      valid: true,
      operation,
      l1ChainId: parseInt(chainId),
      stackType,
      identityContract,
      appchainName: trimmedName,
    };
  }
}

export const networkValidator = new NetworkValidator();