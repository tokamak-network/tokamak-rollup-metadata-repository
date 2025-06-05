/**
 * Validation Runner
 * Unified validation logic that can be used by different scripts
 */

import { readMetadataFile, getFileInfo } from './file-utils';
import { getRpcConfig, getLayer2ManagerProxy } from './rpc-config';
import { RollupMetadataValidator } from '../../validators/rollup-validator';

export interface ValidationOptions {
  prTitle?: string;
  verbose?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    filepath: string;
    filename: string;
    network: string;
  };
  rpcInfo: {
    url: string;
    isCustom: boolean;
  };
  metadata?: any;
}

/**
 * Run complete validation on a metadata file
 */
export async function validateRollupFile(
  filepath: string,
  options: ValidationOptions = {},
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: false,
    errors: [],
    warnings: [],
    fileInfo: { filepath: '', filename: '', network: '' },
    rpcInfo: { url: '', isCustom: false },
  };

  try {
    // 1. Get file information and check existence
    const fileInfo = await getFileInfo(filepath);
    result.fileInfo = {
      filepath: fileInfo.filepath,
      filename: fileInfo.filename,
      network: fileInfo.network,
    };

    if (!fileInfo.exists) {
      result.errors.push(`File not found: ${filepath}`);
      return result;
    }

    // 2. Get RPC configuration
    const rpcConfig = getRpcConfig(fileInfo.network);
    result.rpcInfo = {
      url: rpcConfig.url,
      isCustom: rpcConfig.isCustom,
    };

    // 3. Read and parse metadata
    const metadata = await readMetadataFile(fileInfo.filepath);
    result.metadata = metadata;

    // 4. Setup validator with RPC
    const validator = new RollupMetadataValidator();
    validator.setProvider(rpcConfig.url);

    // 5. Run validation
    const validationResult = await validator.validateRollupMetadata(
      metadata,
      fileInfo.filepath,
      options.prTitle,
    );

    result.valid = validationResult.valid;
    result.errors = validationResult.errors;

    // 6. Run staking validation if candidate
    if (metadata.staking.isCandidate) {
      const layer2ManagerProxy = getLayer2ManagerProxy(fileInfo.network);
      if (layer2ManagerProxy) {
        const stakingResult = await validator.validateStakingRegistration(
          metadata,
          layer2ManagerProxy,
        );
        if (!stakingResult.valid) {
          result.errors.push(`Staking validation failed: ${stakingResult.error}`);
          result.valid = false;
        }
      } else {
        result.warnings.push(
          `No Layer2ManagerProxy address configured for network ${fileInfo.network}. Skipping staking validation.`,
        );
      }
    }

    // 7. Add helpful warnings
    if (!rpcConfig.isCustom) {
      result.warnings.push(
        `Using public RPC for ${fileInfo.network}. Set ${fileInfo.network.toUpperCase()}_RPC_URL for higher rate limits.`,
      );
    }

    return result;

  } catch (error) {
    result.errors.push(`Validation error: ${(error as Error).message}`);
    return result;
  }
}

/**
 * Display validation results in a user-friendly format
 */
export function displayValidationResults(result: ValidationResult, verbose: boolean = false): void {
  console.log(`🔍 Validating rollup metadata: ${result.fileInfo.filepath}`);

  if (result.fileInfo.network) {
    console.log(`📡 Detected network: ${result.fileInfo.network}`);
  }

  if (result.rpcInfo.url) {
    const rpcType = result.rpcInfo.isCustom ? 'custom' : 'public';
    const urlDisplay = result.rpcInfo.url.substring(0, 30) + '...';
    console.log(`🌐 Using ${rpcType} RPC for ${result.fileInfo.network}: ${urlDisplay}`);
  }

  // Display warnings
  if (result.warnings.length > 0 && verbose) {
    result.warnings.forEach(warning => {
      console.log(`⚠️  ${warning}`);
    });
  }

  if (result.valid) {
    console.log('✅ All validations passed!');
    console.log('📋 Validation summary:');
    console.log('  ✅ JSON schema validation');
    console.log('  ✅ Contract address format validation');
    console.log('  ✅ OnChain sequencer verification');
    console.log('  ✅ Sequencer signature verification');
    console.log('  ✅ File existence validation for operation type');
    console.log('  ✅ Immutable fields protection (for updates)');
    console.log('  ✅ Network consistency validation');
    console.log('  ✅ PR title format validation');

    // Display metadata info if available
    if (result.metadata && verbose) {
      console.log('\n📋 Rollup Information:');
      console.log(`   L1 Chain ID: ${result.metadata.l1ChainId}`);
      console.log(`   L2 Chain ID: ${result.metadata.l2ChainId}`);
      console.log(`   Name: ${result.metadata.name}`);
      console.log(`   Type: ${result.metadata.rollupType}`);
      console.log(`   Stack: ${result.metadata.stack.name} v${result.metadata.stack.version}`);
      console.log(`   Status: ${result.metadata.status}`);
      console.log(`   Sequencer: ${result.metadata.sequencer.address}`);
      console.log(`   Staking Candidate: ${result.metadata.staking.isCandidate ? 'Yes' : 'No'}`);
    }
  } else {
    console.error('❌ Validation failed with the following errors:');
    result.errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
  }
}