import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  type StackType,
  type TokamakAppchainMetadata,
  STACK_REQUIRED_L1_CONTRACTS,
} from '../schemas/tokamak-appchain-metadata';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// JSON schema for TokamakAppchainMetadata
const appchainMetadataSchema = {
  type: 'object',
  required: [
    'l1ChainId', 'l2ChainId', 'name', 'description', 'stackType', 'rollupType',
    'rpcUrl', 'nativeToken', 'status', 'createdAt', 'lastUpdated',
    'l1Contracts', 'operator', 'metadata',
  ],
  properties: {
    l1ChainId: { type: 'number', minimum: 1 },
    l2ChainId: { type: 'number', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', minLength: 1, maxLength: 500 },
    logo: { type: 'string', format: 'uri' },
    website: { type: 'string', format: 'uri' },
    stackType: {
      type: 'string',
      enum: ['tokamak-appchain', 'tokamak-private-app-channel', 'py-ethclient'],
    },
    stackVersion: { type: 'string' },
    rollupType: {
      type: 'string',
      enum: ['optimistic', 'zk', 'sovereign'],
    },
    rpcUrl: { type: 'string', format: 'uri' },
    wsUrl: { type: 'string', pattern: '^wss?://.+' }, // ws:// not supported by ajv-formats uri
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
    l1Contracts: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    l2Contracts: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    operator: {
      type: 'object',
      required: ['address'],
      properties: {
        address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        batcherAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        proposerAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
      },
    },
    bridges: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type', 'url'],
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
    networkConfig: {
      type: 'object',
      required: ['blockTime', 'gasLimit'],
      properties: {
        blockTime: { type: 'number', minimum: 1 },
        gasLimit: { type: 'string' },
        baseFeePerGas: { type: 'string' },
        priorityFeePerGas: { type: 'string' },
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
        xUrl: { type: 'string', format: 'uri' },
        telegramUrl: { type: 'string', format: 'uri' },
        dashboardUrl: { type: 'string', format: 'uri' },
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
    withdrawalConfig: {
      type: 'object',
      required: ['challengePeriod', 'expectedWithdrawalDelay'],
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

const validateSchema = ajv.compile(appchainMetadataSchema);

/**
 * Schema validator for TokamakAppchainMetadata JSON files.
 */
export class AppchainSchemaValidator {
  /**
   * Validate JSON against the appchain metadata schema.
   */
  public validateSchema(metadata: unknown): { valid: boolean; errors?: unknown[] } {
    const valid = validateSchema(metadata);
    if (!valid) {
      return {
        valid,
        errors: validateSchema.errors || [],
      };
    }

    // Stack-specific required l1Contracts validation
    const conditionalErrors = this.validateStackContracts(metadata as unknown as TokamakAppchainMetadata);
    if (conditionalErrors.length > 0) {
      return {
        valid: false,
        errors: conditionalErrors,
      };
    }

    // ERC20 native token requires l1Address
    const tokenErrors = this.validateNativeTokenRequirements(metadata as unknown as TokamakAppchainMetadata);
    if (tokenErrors.length > 0) {
      return {
        valid: false,
        errors: tokenErrors,
      };
    }

    return { valid: true };
  }

  /**
   * Validate stack-specific required l1Contracts fields.
   */
  private validateStackContracts(metadata: TokamakAppchainMetadata): unknown[] {
    const errors: unknown[] = [];
    const stackType = metadata.stackType as StackType;
    const requiredContracts = STACK_REQUIRED_L1_CONTRACTS[stackType];

    if (!requiredContracts) {
      errors.push({
        keyword: 'enum',
        instancePath: '/stackType',
        message: `Unknown stack type: ${metadata.stackType}`,
      });
      return errors;
    }

    const l1Contracts = metadata.l1Contracts || {};
    for (const contract of requiredContracts) {
      if (!l1Contracts[contract]) {
        errors.push({
          keyword: 'required',
          instancePath: `/l1Contracts/${contract}`,
          params: { missingProperty: contract },
          message: `stackType '${stackType}' requires l1Contracts.${contract}`,
        });
      }
    }

    return errors;
  }

  /**
   * Validate ERC20 native token has l1Address.
   */
  private validateNativeTokenRequirements(metadata: TokamakAppchainMetadata): unknown[] {
    const errors: unknown[] = [];

    if (metadata.nativeToken.type === 'erc20' && !metadata.nativeToken.l1Address) {
      errors.push({
        keyword: 'required',
        instancePath: '/nativeToken/l1Address',
        message: "nativeToken.type is 'erc20' but l1Address is missing",
      });
    }

    return errors;
  }
}

export const appchainSchemaValidator = new AppchainSchemaValidator();
