import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

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
    l2Contracts: {
      type: 'object',
      required: ['NativeToken'],
      properties: {
        NativeToken: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
      },
      additionalProperties: true,
    },
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
        baseFeePerGas: { type: 'string' },
        priorityFeePerGas: { type: 'string' },
        batchTimeout: { type: 'number' },
        trustedAggregatorTimeout: { type: 'number' },
        forceBatchTimeout: { type: 'number' },
      },
    },
    withdrawalConfig: {
      type: 'object',
      required: ['challengePeriod', 'expectedWithdrawalDelay', 'monitoringInfo'],
      properties: {
        challengePeriod: { type: 'number', minimum: 1 },
        expectedWithdrawalDelay: { type: 'number', minimum: 1 },
        monitoringInfo: {
          type: 'object',
          required: ['l2OutputOracleAddress'],
          properties: {
            l2OutputOracleAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
            outputProposedEventTopic: { type: 'string' },
          },
        },
        batchSubmissionFrequency: { type: 'number', minimum: 1 },
        outputRootFrequency: { type: 'number', minimum: 1 },
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

// Required contracts for Thanos optimistic rollups
const THANOS_L1_REQUIRED_CONTRACTS = [
  'SystemConfig', 'ProxyAdmin', 'AddressManager', 'SuperchainConfig', 'DisputeGameFactory',
  'L1CrossDomainMessenger', 'L1ERC721Bridge', 'L1StandardBridge', 'OptimismMintableERC20Factory',
  'OptimismPortal', 'AnchorStateRegistry', 'DelayedWETH', 'L1UsdcBridge', 'L2OutputOracle',
  'Mips', 'PermissionedDelayedWETH', 'PreimageOracle', 'ProtocolVersions', 'SafeProxyFactory',
  'SafeSingleton', 'SystemOwnerSafe',
];

const THANOS_L2_REQUIRED_CONTRACTS = [
  'NativeToken',
  'WETH',
  'L2ToL1MessagePasser',
  'DeployerWhitelist',
  'L2CrossDomainMessenger',
  'GasPriceOracle',
  'L2StandardBridge',
  'SequencerFeeVault',
  'OptimismMintableERC20Factory',
  'L1BlockNumber',
  'L1Block',
  'GovernanceToken',
  'LegacyMessagePasser',
  'L2ERC721Bridge',
  'OptimismMintableERC721Factory',
  'ProxyAdmin',
  'BaseFeeVault',
  'L1FeeVault',
  'ETH',
];

/**
 * Schema validation module
 */
export class SchemaValidator {
  /**
   * JSON schema validation
   */
  public validateSchema(metadata: unknown): { valid: boolean; errors?: unknown[] } {
    const valid = validateSchema(metadata);
    if (!valid) {
      return {
        valid,
        errors: validateSchema.errors || [],
      };
    }

    // Additional conditional validation for Thanos optimistic rollups
    const conditionalErrors = this.validateConditionalContracts(metadata as any);
    if (conditionalErrors.length > 0) {
      return {
        valid: false,
        errors: conditionalErrors,
      };
    }

    return { valid: true };
  }

  /**
   * Validate conditional contract requirements for Thanos optimistic rollups
   */
  private validateConditionalContracts(metadata: any): unknown[] {
    const errors: unknown[] = [];

    // Check if this is a Thanos optimistic rollup
    const isThanosOptimistic =
      metadata.rollupType === 'optimistic' &&
      metadata.stack?.name === 'thanos';

    if (isThanosOptimistic) {
      // Validate L1 contracts
      const l1Contracts = metadata.l1Contracts || {};
      for (const contract of THANOS_L1_REQUIRED_CONTRACTS) {
        if (!l1Contracts[contract]) {
          errors.push({
            keyword: 'required',
            instancePath: `/l1Contracts/${contract}`,
            schemaPath: '#/properties/l1Contracts/required',
            params: { missingProperty: contract },
            message: `Missing required L1 contract '${contract}' for Thanos optimistic rollup`,
          });
        }
      }

      // Validate L2 contracts
      const l2Contracts = metadata.l2Contracts || {};
      for (const contract of THANOS_L2_REQUIRED_CONTRACTS) {
        if (!l2Contracts[contract]) {
          errors.push({
            keyword: 'required',
            instancePath: `/l2Contracts/${contract}`,
            schemaPath: '#/properties/l2Contracts/required',
            params: { missingProperty: contract },
            message: `Missing required L2 contract '${contract}' for Thanos optimistic rollup`,
          });
        }
      }
    }

    return errors;
  }
}

export const schemaValidator = new SchemaValidator();