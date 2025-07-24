import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ethers, JsonRpcProvider, Contract } from 'ethers';
import { L2RollupMetadata } from '../schemas/rollup-metadata';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// SystemConfig contract ABI (unsafeBlockSigner function only)
const SYSTEM_CONFIG_ABI = [
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
const LAYER2_MANAGER_ABI = [
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

// JSON schema definition
const rollupMetadataSchema = {
  type: 'object',
  required: [
    'l1ChainId', 'l2ChainId', 'name', 'description', 'rollupType', 'stack',
    'rpcUrl', 'nativeToken', 'status', 'createdAt', 'lastUpdated', 'l1Contracts', 'l2Contracts',
    'bridges', 'explorers', 'sequencer', 'staking', 'networkConfig', 'metadata',
  ],
  properties: {
    l1ChainId: { type: 'number', minimum: 1 }, // L1 chain ID
    l2ChainId: { type: 'number', minimum: 1 }, // L2 chain ID
    name: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    logo: { type: 'string', format: 'uri' },
    website: { type: 'string', format: 'uri' },
    rollupType: {
      type: 'string',
      enum: ['optimistic', 'zk', 'sovereign', 'validium'],
    },
    stack: {
      type: 'object',
      required: ['name', 'version'],
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        zkProofSystem: {
          type: 'string',
          enum: ['plonk', 'stark', 'groth16', 'fflonk'],
        },
      },
    },
    rpcUrl: { type: 'string', format: 'uri' },
    wsUrl: { type: 'string', format: 'uri' },
    nativeToken: {
      type: 'object',
      required: ['type', 'symbol', 'name', 'decimals'],
      properties: {
        type: { enum: ['eth', 'erc20'] },
        symbol: { type: 'string', minLength: 1 },
        name: { type: 'string', minLength: 1 },
        decimals: { type: 'number', minimum: 0, maximum: 18 },
        l1Address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        logoUrl: { type: 'string', format: 'uri' },
        coingeckoId: { type: 'string' },
      },
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'maintenance', 'deprecated', 'shutdown'],
    },
    createdAt: { type: 'string', format: 'date-time' },
    lastUpdated: { type: 'string', format: 'date-time' },
    // L1/L2 contracts are optional, so additionalProperties: true
    l1Contracts: {
      type: 'object',
      required: ['SystemConfig'],
      properties: {
        SystemConfig: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
      },
      additionalProperties: true,
    },
    l2Contracts: { type: 'object' },
    bridges: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type', 'url', 'supportedTokens'],
        properties: {
          name: { type: 'string' },
          type: { enum: ['native', 'canonical', 'third-party'] },
          url: { type: 'string', format: 'uri' },
          status: { enum: ['active', 'inactive', 'maintenance', 'none'] },
          supportedTokens: {
            type: 'array',
            items: {
              type: 'object',
              required: ['symbol', 'l1Address', 'l2Address', 'decimals'],
              properties: {
                symbol: { type: 'string' },
                l1Address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                l2Address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                decimals: { type: 'number', minimum: 0 },
                isNativeToken: { type: 'boolean' },
                isWrappedETH: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    explorers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'url', 'type'],
        properties: {
          name: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          type: { enum: ['blockscout', 'etherscan', 'custom'] },
          status: { enum: ['active', 'inactive', 'maintenance', 'none'] },
          apiUrl: { type: 'string', format: 'uri' },
        },
      },
    },
    supportResources: {
      type: 'object',
      properties: {
        statusPageUrl: { type: 'string', format: 'uri' },
        supportContactUrl: { type: 'string', format: 'uri' },
        documentationUrl: { type: 'string', format: 'uri' },
        communityUrl: { type: 'string', format: 'uri' },
        helpCenterUrl: { type: 'string', format: 'uri' },
        announcementUrl: { type: 'string', format: 'uri' },
      },
    },
    sequencer: {
      type: 'object',
      required: ['address'],
      properties: {
        address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        batcherAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        proposerAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        aggregatorAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        trustedSequencer: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
      },
    },
    staking: {
      type: 'object',
      required: ['isCandidate'],
      properties: {
        isCandidate: { type: 'boolean' },
        candidateRegisteredAt: { type: 'string', format: 'date-time' },
        candidateStatus: { enum: ['not_registered', 'pending', 'active', 'suspended', 'terminated'] },
        registrationTxHash: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
        candidateAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        rollupConfigAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        stakingServiceName: { type: 'string' },
      },
      if: {
        properties: { isCandidate: { const: true } },
      },
      then: {
        required: ['isCandidate', 'registrationTxHash', 'candidateAddress'],
      },
    },
    networkConfig: {
      type: 'object',
      required: ['blockTime', 'gasLimit'],
      properties: {
        blockTime: { type: 'number', minimum: 1 },
        gasLimit: { type: 'string' },
      },
    },
    shutdown: {
      type: 'object',
      required: ['isPlanned', 'reason'],
      properties: {
        isPlanned: { type: 'boolean' },
        plannedShutdownDate: { type: 'string', format: 'date-time' },
        actualShutdownDate: { type: 'string', format: 'date-time' },
        reason: { type: 'string' },
      },
    },
    metadata: {
      type: 'object',
      required: ['version', 'signature', 'signedBy'],
      properties: {
        version: { type: 'string' },
        signature: { type: 'string', pattern: '^0x[a-fA-F0-9]{130}$' },
        signedBy: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
      },
    },
  },
};

const validateSchema = ajv.compile(rollupMetadataSchema);

/**
 * L2 rollup metadata validation class
 */
export class RollupMetadataValidator {
  private provider: JsonRpcProvider | null = null;

  /**
   * Set RPC provider
   */
  public setProvider(rpcUrl: string): void {
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  /**
   * Validate that a contract is deployed at the given address
   */
  public async validateContractExistence(contractAddress: string): Promise<{ valid: boolean; error?: string }> {
    if (!this.provider) {
      return {
        valid: false,
        error: 'RPC provider not set. Call setProvider() first.',
      };
    }

    try {
      const code = await this.provider.getCode(contractAddress);

      if (code === '0x' || code === '0x0') {
        return {
          valid: false,
          error: `No contract deployed at address: ${contractAddress}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to check contract existence: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get actual sequencer address from SystemConfig contract
   */
  public async getOnChainSequencerAddress(systemConfigAddress: string): Promise<string | null> {
    if (!this.provider) {
      throw new Error('RPC provider not set. Call setProvider() first.');
    }

    try {
      const systemConfigContract = new Contract(
        systemConfigAddress,
        SYSTEM_CONFIG_ABI,
        this.provider,
      );

      const sequencerAddress = await systemConfigContract.unsafeBlockSigner();
      return sequencerAddress.toLowerCase();
    } catch (error) {
      console.error(`Failed to get sequencer address from SystemConfig ${systemConfigAddress}:`, error);
      return null;
    }
  }

  /**
   * JSON schema validation
   */
  public validateSchema(metadata: unknown): { valid: boolean; errors?: unknown[] } {
    const valid = validateSchema(metadata);
    return {
      valid,
      errors: valid ? undefined : (validateSchema.errors || []),
    };
  }

  /**
   * Ethereum address format validation
   */
  public isValidAddress(address: string): boolean {
    try {
      // 1. 기본 형식 체크 (0x 또는 0X로 시작하고 40자리 hex)
      if (!/^0[xX][a-fA-F0-9]{40}$/.test(address)) {
        return false;
      }

      // 2. 0X를 0x로 정규화
      const normalizedAddress = address.startsWith('0x') ? address : '0x' + address.slice(2);

      // 3. ethers.js로 기본 유효성 검증
      if (!ethers.isAddress(normalizedAddress)) {
        return false;
      }

      // 4. 체크섬 검증 (mixed case인 경우만)
      const hexPart = address.slice(2);
      const hasUpperCase = /[A-F]/.test(hexPart);
      const hasLowerCase = /[a-f]/.test(hexPart);

      // Mixed case라면 체크섬이 정확해야 함
      if (hasUpperCase && hasLowerCase) {
        try {
          const checksumAddress = ethers.getAddress(normalizedAddress);
          return checksumAddress === normalizedAddress;
        } catch {
          return false; // 체크섬이 틀림
        }
      }

      // 모두 소문자 또는 모두 대문자면 허용 (체크섬 없음)
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate filename matches SystemConfig address
   */
  public validateFilename(filename: string, systemConfigAddress: string): boolean {
    const expectedFilename = `${systemConfigAddress.toLowerCase()}.json`;
    return filename === expectedFilename;
  }

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

  /**
   * Validate onchain sequencer address matches metadata sequencer address
   */
  public async validateOnChainSequencer(
    metadata: L2RollupMetadata,
  ): Promise<{ valid: boolean; error?: string; onChainAddress?: string }> {
    if (!metadata.l1Contracts.SystemConfig) {
      return {
        valid: false,
        error: 'SystemConfig address is required for sequencer validation',
      };
    }

    // First, check if contract exists
    const contractExistenceResult = await this.validateContractExistence(
      metadata.l1Contracts.SystemConfig,
    );
    if (!contractExistenceResult.valid) {
      return {
        valid: false,
        error: contractExistenceResult.error,
      };
    }

    try {
      const onChainSequencerAddress = await this.getOnChainSequencerAddress(
        metadata.l1Contracts.SystemConfig,
      );

      if (!onChainSequencerAddress) {
        return {
          valid: false,
          error: 'Failed to fetch sequencer address from SystemConfig contract',
        };
      }

      const metadataSequencerAddress = metadata.sequencer.address.toLowerCase();

      if (onChainSequencerAddress !== metadataSequencerAddress) {
        return {
          valid: false,
          error: `Sequencer address mismatch. OnChain: ${onChainSequencerAddress}, Metadata: ${metadataSequencerAddress}`,
          onChainAddress: onChainSequencerAddress,
        };
      }

      return {
        valid: true,
        onChainAddress: onChainSequencerAddress,
      };
    } catch (error) {
      return {
        valid: false,
        error: `OnChain sequencer validation failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate sequencer signature (using onchain address)
   */
  public async validateSequencerSignature(
    metadata: L2RollupMetadata,
    operation: 'register' | 'update' = 'register',
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Verify onchain sequencer address
      const onChainValidation = await this.validateOnChainSequencer(metadata);
      if (!onChainValidation.valid) {
        return {
          valid: false,
          error: `OnChain validation failed: ${onChainValidation.error}`,
        };
      }

      // Reconstruct message for signature verification with dynamic operation
      const message = `Tokamak Rollup Registry\nL1 Chain ID: ${metadata.l1ChainId}\nL2 Chain ID: ${metadata.l2ChainId}\nOperation: ${operation}\nSystemConfig: ${metadata.l1Contracts.SystemConfig.toLowerCase()}`;

      const recoveredAddress = ethers.verifyMessage(
        message,
        metadata.metadata.signature,
      );

      // Check if recovered address matches metadata signer
      if (recoveredAddress.toLowerCase() !== metadata.metadata.signedBy.toLowerCase()) {
        return {
          valid: false,
          error: 'Signature verification failed: recovered address does not match signedBy',
        };
      }

      // Check if signer matches onchain sequencer
      if (recoveredAddress.toLowerCase() !== onChainValidation.onChainAddress) {
        return {
          valid: false,
          error: `Signature verification failed: signer (${recoveredAddress.toLowerCase()}) is not the onchain sequencer (${onChainValidation.onChainAddress})`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Signature verification failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Complete metadata validation
   */
  public async validateRollupMetadata(
    metadata: L2RollupMetadata,
    filepath: string,
    prTitle?: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    let operation: 'register' | 'update' = 'register'; // default to register

    // Extract network from file path
    const networkFromPath = this.extractNetworkFromPath(filepath);
    if (!networkFromPath) {
      errors.push(`Could not extract network from file path: ${filepath}`);
    }

    // 1. JSON schema validation
    const schemaResult = this.validateSchema(metadata);
    if (!schemaResult.valid) {
      errors.push(`Schema validation failed: ${JSON.stringify(schemaResult.errors, null, 2)}`);
    }

    // 2. PR title validation (if provided)
    if (prTitle) {
      const prResult = this.parsePRTitle(prTitle);
      if (!prResult.valid) {
        errors.push(prResult.error!);
      } else {
        // Extract operation from PR title
        operation = prResult.operation!;

        // Verify SystemConfig address match
        if (prResult.systemConfigAddress !== metadata.l1Contracts.SystemConfig?.toLowerCase()) {
          errors.push(`PR title SystemConfig address (${prResult.systemConfigAddress}) does not match metadata SystemConfig address (${metadata.l1Contracts.SystemConfig})`);
        }

        // Verify network match (now always provided in PR title)
        if (prResult.network && networkFromPath && prResult.network !== networkFromPath) {
          errors.push(`PR title network (${prResult.network}) does not match file path network (${networkFromPath})`);
        }

        // Verify rollup name match (now always provided in PR title)
        if (prResult.rollupName && prResult.rollupName !== metadata.name) {
          errors.push(`PR title rollup name (${prResult.rollupName}) does not match metadata name (${metadata.name})`);
        }

        // 📌 Operation-specific validations
        // Note: File existence checking should be done by CI/GitHub Actions
        // since this validator doesn't have file system access in all contexts
        if (operation === 'register') {
          // For register operations, we expect this to be a new rollup
          // Additional validations could include:
          // - Ensure chainId is not already taken (requires external registry)
          // - Validate initial staking registration if applicable
        } else if (operation === 'update') {
          // For update operations, we expect this to be an existing rollup
          // Additional validations could include:
          // - Validate that certain immutable fields haven't changed
          // - Check that updates are semantically valid (e.g., status transitions)
        }
      }
    }

    // 3. Filename validation
    const filename = filepath.split('/').pop() || '';
    if (metadata.l1Contracts.SystemConfig && !this.validateFilename(filename, metadata.l1Contracts.SystemConfig)) {
      errors.push(`Filename should be ${metadata.l1Contracts.SystemConfig.toLowerCase()}.json, got ${filename}`);
    }

    // 4. Onchain sequencer validation and signature verification with dynamic operation
    const signatureResult = await this.validateSequencerSignature(metadata, operation);
    if (!signatureResult.valid) {
      errors.push(signatureResult.error!);
    }

    // 5. Contract address format validation
    const validateContractAddresses = (contracts: Record<string, string | undefined>, prefix: string) => {
      Object.entries(contracts).forEach(([name, address]) => {
        if (address && !this.isValidAddress(address)) {
          errors.push(`Invalid ${prefix} contract address for ${name}: ${address}`);
        }
      });
    };

    validateContractAddresses(metadata.l1Contracts, 'L1');
    validateContractAddresses(metadata.l2Contracts, 'L2');

    // 6. Sequencer address validation
    if (!this.isValidAddress(metadata.sequencer.address)) {
      errors.push(`Invalid sequencer address: ${metadata.sequencer.address}`);
    }

    // 7. Native token validation
    if (metadata.nativeToken.type === 'erc20') {
      if (!metadata.nativeToken.l1Address) {
        errors.push('ERC20 native token requires l1Address');
      } else if (!this.isValidAddress(metadata.nativeToken.l1Address)) {
        errors.push(`Invalid ERC20 native token L1 address: ${metadata.nativeToken.l1Address}`);
      }
    }

    // 7.1. Native token address consistency validation (ERC20 only)
    const nativeTokenResult = await this.validateNativeTokenAddress(metadata);
    if (!nativeTokenResult.valid) {
      errors.push(nativeTokenResult.error!);
    }

    // 8. Network chainId consistency validation
    if (networkFromPath) {
      const chainIdConsistencyResult = this.validateNetworkChainIdConsistency(networkFromPath, metadata.l1ChainId);
      if (!chainIdConsistencyResult.valid) {
        errors.push(chainIdConsistencyResult.error!);
      }
    }

    // 9. File existence validation for register vs update operations
    const fileExistenceResult = this.validateFileExistenceForOperation(filepath, operation);
    if (!fileExistenceResult.valid) {
      errors.push(fileExistenceResult.error!);
    }

    // 10. Immutable fields validation during update operations
    if (operation === 'update') {
      const immutableFieldsResult = this.validateImmutableFields(metadata, filepath);
      if (!immutableFieldsResult.valid) {
        errors.push(...immutableFieldsResult.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate file existence for register vs update operations
   */
  public validateFileExistenceForOperation(
    filepath: string,
    operation: 'register' | 'update',
  ): { valid: boolean; error?: string } {
    // Note: File existence validation is now handled by GitHub Actions
    // which properly compares with the main branch to determine if a file
    // is newly added (register) or modified (update).
    //
    // This validation is kept for compatibility but should not fail
    // based on local filesystem state since that creates a catch-22
    // where new rollups cannot be registered.

    // Keep parameters for API compatibility
    void filepath;
    void operation;

    return { valid: true };
  }

  /**
   * Validate immutable fields during update operations
   */
  public validateImmutableFields(
    newMetadata: L2RollupMetadata,
    existingFilepath: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fs = require('fs');

    try {
      if (!fs.existsSync(existingFilepath)) {
        // If file doesn't exist, this validation doesn't apply
        return { valid: true, errors: [] };
      }

      const existingContent = fs.readFileSync(existingFilepath, 'utf8');
      const existingMetadata: L2RollupMetadata = JSON.parse(existingContent);

      // Define immutable fields that cannot be changed during updates
      const immutableFields = [
        { path: 'l1ChainId', name: 'L1 Chain ID' },
        { path: 'l2ChainId', name: 'L2 Chain ID' },
        { path: 'l1Contracts.SystemConfig', name: 'SystemConfig address' },
        { path: 'rollupType', name: 'Rollup type' },
        { path: 'stack.name', name: 'Stack name' },
        { path: 'createdAt', name: 'Creation timestamp' },
      ];

      // Check each immutable field
      for (const field of immutableFields) {
        const existingValue = this.getNestedValue(existingMetadata, field.path);
        const newValue = this.getNestedValue(newMetadata, field.path);

        if (existingValue !== undefined && newValue !== existingValue) {
          errors.push(
            `Immutable field '${field.name}' cannot be changed during update. ` +
            `Existing: ${existingValue}, New: ${newValue}`,
          );
        }
      }

      // Special validation for staking candidate registration
      if (existingMetadata.staking.isCandidate && existingMetadata.staking.registrationTxHash) {
        if (newMetadata.staking.registrationTxHash !== existingMetadata.staking.registrationTxHash) {
          errors.push(
            'Staking registration transaction hash cannot be changed during update. ' +
            `Existing: ${existingMetadata.staking.registrationTxHash}, New: ${newMetadata.staking.registrationTxHash}`,
          );
        }
        if (newMetadata.staking.candidateAddress !== existingMetadata.staking.candidateAddress) {
          errors.push(
            'Staking candidate address cannot be changed during update. ' +
            `Existing: ${existingMetadata.staking.candidateAddress}, New: ${newMetadata.staking.candidateAddress}`,
          );
        }
      }

    } catch (error) {
      errors.push(`Failed to validate immutable fields: ${(error as Error).message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Helper function to get nested object values using dot notation
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && current !== null && key in current ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  /**
   * Validate staking registration transaction and candidate address
   */
  public async validateStakingRegistration(
    metadata: L2RollupMetadata,
    layer2ManagerAddress: string,
  ): Promise<{ valid: boolean; error?: string }> {
    if (!metadata.staking.isCandidate) {
      return { valid: true }; // No validation needed if not a candidate
    }

    if (!metadata.staking.registrationTxHash || !metadata.staking.candidateAddress) {
      return {
        valid: false,
        error: 'Registration transaction hash and candidate address are required when isCandidate is true',
      };
    }

    if (!this.provider) {
      return {
        valid: false,
        error: 'RPC provider not set. Call setProvider() first.',
      };
    }

    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(metadata.staking.registrationTxHash);
      if (!receipt) {
        return {
          valid: false,
          error: `Transaction not found: ${metadata.staking.registrationTxHash}`,
        };
      }

      // Check if transaction was sent to Layer2ManagerProxy
      if (receipt.to?.toLowerCase() !== layer2ManagerAddress.toLowerCase()) {
        return {
          valid: false,
          error: `Transaction was not sent to Layer2ManagerProxy (${layer2ManagerAddress}), got: ${receipt.to}`,
        };
      }

      // Get transaction data to verify function call
      const tx = await this.provider.getTransaction(metadata.staking.registrationTxHash);
      if (!tx) {
        return {
          valid: false,
          error: `Transaction details not found: ${metadata.staking.registrationTxHash}`,
        };
      }

      // Decode transaction data to verify registerCandidateAddOn function call
      const iface = new ethers.Interface(LAYER2_MANAGER_ABI);
      let decodedData;
      try {
        decodedData = iface.parseTransaction({ data: tx.data, value: tx.value });
      } catch (error) {
        return {
          valid: false,
          error: 'Failed to decode transaction data. Expected registerCandidateAddOn function call.',
        };
      }

      if (!decodedData || decodedData.name !== 'registerCandidateAddOn') {
        return {
          valid: false,
          error: `Expected registerCandidateAddOn function call, got: ${decodedData?.name || 'unknown'}`,
        };
      }

      // Verify rollupConfig parameter matches SystemConfig address
      const rollupConfigParam = decodedData.args[0]; // first parameter
      if (rollupConfigParam.toLowerCase() !== metadata.l1Contracts.SystemConfig.toLowerCase()) {
        return {
          valid: false,
          error: `rollupConfig parameter (${rollupConfigParam}) does not match SystemConfig address (${metadata.l1Contracts.SystemConfig})`,
        };
      }

      // Parse logs to find RegisteredCandidateAddOn event
      const registeredEvent = receipt.logs.find(log => {
        try {
          const parsedLog = iface.parseLog({ topics: log.topics, data: log.data });
          return parsedLog?.name === 'RegisteredCandidateAddOn';
        } catch {
          return false;
        }
      });

      if (!registeredEvent) {
        return {
          valid: false,
          error: 'RegisteredCandidateAddOn event not found in transaction logs',
        };
      }

      // Decode the event to get candidateAddOn address
      const parsedEvent = iface.parseLog({ topics: registeredEvent.topics, data: registeredEvent.data });
      if (!parsedEvent) {
        return {
          valid: false,
          error: 'Failed to parse RegisteredCandidateAddOn event',
        };
      }

      const eventCandidateAddress = parsedEvent.args.candidateAddOn;

      // Verify candidate address matches event
      if (eventCandidateAddress.toLowerCase() !== metadata.staking.candidateAddress.toLowerCase()) {
        return {
          valid: false,
          error: `candidateAddress (${metadata.staking.candidateAddress}) does not match event candidateAddOn (${eventCandidateAddress})`,
        };
      }

      // Verify event rollupConfig matches SystemConfig
      const eventRollupConfig = parsedEvent.args.rollupConfig;
      if (eventRollupConfig.toLowerCase() !== metadata.l1Contracts.SystemConfig.toLowerCase()) {
        return {
          valid: false,
          error: `Event rollupConfig (${eventRollupConfig}) does not match SystemConfig address (${metadata.l1Contracts.SystemConfig})`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Staking registration validation failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate native token address consistency for ERC20 tokens
   */
  public async validateNativeTokenAddress(
    metadata: L2RollupMetadata,
  ): Promise<{ valid: boolean; error?: string }> {
    // Skip validation for ETH native tokens
    if (metadata.nativeToken.type === 'eth') {
      return { valid: true };
    }

    // Only validate ERC20 tokens
    if (metadata.nativeToken.type !== 'erc20' || !metadata.nativeToken.l1Address) {
      return { valid: true }; // Schema validation will catch missing l1Address for ERC20
    }

    if (!this.provider) {
      return {
        valid: false,
        error: 'RPC provider not set. Call setProvider() first.',
      };
    }

    try {
      const systemConfigContract = new Contract(
        metadata.l1Contracts.SystemConfig,
        SYSTEM_CONFIG_ABI,
        this.provider,
      );

      const onChainNativeTokenAddress = await systemConfigContract.nativeTokenAddress();
      const normalizedOnChain = onChainNativeTokenAddress.toLowerCase();
      const normalizedMetadata = metadata.nativeToken.l1Address.toLowerCase();

      if (normalizedOnChain !== normalizedMetadata) {
        return {
          valid: false,
          error: `Native token address mismatch. SystemConfig.nativeTokenAddress(): ${normalizedOnChain}, Metadata nativeToken.l1Address: ${normalizedMetadata}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Native token address validation failed: ${(error as Error).message}`,
      };
    }
  }
}

export const rollupValidator = new RollupMetadataValidator();