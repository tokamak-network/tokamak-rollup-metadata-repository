import { RollupMetadataValidator } from '../validators/rollup-validator';

describe('Debug Validation', () => {
  let validator: RollupMetadataValidator;

  beforeEach(() => {
    validator = new RollupMetadataValidator();
  });

  test('debug schema validation errors', () => {
    const validMetadata = {
      l1ChainId: 11155111, // Sepolia
      l2ChainId: 17001, // L2 chain ID
      name: 'Test L2',
      description: 'Test description',
      rollupType: 'optimistic',
      stack: {
        name: 'thanos',
        version: '1.0.0',
      },
      rpcUrl: 'https://rpc.test-l2.com',
      nativeToken: {
        type: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
      },
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      lastUpdated: '2025-01-01T00:00:00Z',
      l1Contracts: {
        SystemConfig: '0x1234567890123456789012345678901234567890',
      },
      l2Contracts: {
        NativeToken: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
      },
      bridges: [],
      explorers: [],
      sequencer: {
        address: '0x1234567890123456789012345678901234567890',
      },
      staking: {
        isCandidate: false,
      },
      networkConfig: {
        blockTime: 2,
        gasLimit: '30000000',
      },
      metadata: {
        version: '1.0.0',
        signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        signedBy: '0x1234567890123456789012345678901234567890',
      },
    };

    const result = validator.validateSchema(validMetadata);

    console.log('Validation result:', result);
    if (!result.valid) {
      console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
    }
  });

  test('debug address validation', () => {
    const testAddresses = [
      '0x1234567890123456789012345678901234567890',
      '0xabcdefABCDEF1234567890123456789012345678',
      'invalid',
      '0x123',
    ];

    testAddresses.forEach(addr => {
      const isValid = validator.isValidAddress(addr);
      console.log(`Address ${addr}: ${isValid}`);
    });
  });
});