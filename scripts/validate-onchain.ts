#!/usr/bin/env node

import path from 'path';
import { readMetadataFile, getFileInfo } from '../src/utils/file-utils';
import { getRpcConfig } from '../src/utils/rpc-config';
import { RollupMetadataValidator } from '../validators/rollup-validator';

/**
 * On-chain validation only CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run validate:onchain <file-path>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run validate:onchain data/sepolia/0x1234567890123456789012345678901234567890.json');
    console.error('');
    console.error('Environment variables (optional):');
    console.error('  MAINNET_RPC_URL - Custom Ethereum mainnet RPC URL');
    console.error('  SEPOLIA_RPC_URL - Custom Ethereum sepolia RPC URL');
    process.exit(1);
  }

  let filepath = args[0];

  // Convert relative path to absolute path
  if (!path.isAbsolute(filepath)) {
    filepath = path.resolve(process.cwd(), filepath);
  }

  try {
    console.log(`🔍 On-chain validation: ${filepath}`);

    // 1. Get file information and check existence
    const fileInfo = await getFileInfo(filepath);
    if (!fileInfo.exists) {
      console.error(`❌ File not found: ${filepath}`);
      process.exit(1);
    }

    console.log(`📡 Detected network: ${fileInfo.network}`);

    // 2. Get RPC configuration
    const rpcConfig = getRpcConfig(fileInfo.network);
    const rpcType = rpcConfig.isCustom ? 'custom' : 'public';
    const urlDisplay = rpcConfig.url.substring(0, 30) + '...';
    console.log(`🌐 Using ${rpcType} RPC for ${fileInfo.network}: ${urlDisplay}`);

    // 3. Read and parse metadata
    const metadata = await readMetadataFile(fileInfo.filepath);

    // 4. Setup validator with RPC
    const validator = new RollupMetadataValidator();
    validator.setProvider(rpcConfig.url);

    console.log('');
    console.log('Running on-chain validations...');

    let allValid = true;
    const errors: string[] = [];

    // 5. Validate SystemConfig contract existence
    console.log('🔗 Checking SystemConfig contract...');
    const contractResult = await validator.validateContractExistence(metadata.l1Contracts.systemConfig);
    if (contractResult.valid) {
      console.log('  ✅ SystemConfig contract exists');
    } else {
      console.log(`  ❌ SystemConfig contract validation failed: ${contractResult.error}`);
      errors.push(`SystemConfig contract validation failed: ${contractResult.error}`);
      allValid = false;
    }

    // 6. Validate on-chain sequencer address
    console.log('👤 Checking sequencer address...');
    const sequencerResult = await validator.validateOnChainSequencer(metadata);
    if (sequencerResult.valid) {
      console.log('  ✅ Sequencer address matches on-chain');
      console.log(`  📍 On-chain sequencer: ${sequencerResult.onChainAddress}`);
    } else {
      console.log(`  ❌ Sequencer validation failed: ${sequencerResult.error}`);
      errors.push(`Sequencer validation failed: ${sequencerResult.error}`);
      allValid = false;
    }

    // 7. Validate native token address (for ERC20 tokens)
    if (metadata.nativeToken.type === 'erc20') {
      console.log('🪙 Checking native token address...');
      const tokenResult = await validator.validateNativeTokenAddress(metadata);
      if (tokenResult.valid) {
        console.log('  ✅ Native token address matches SystemConfig');
      } else {
        console.log(`  ❌ Native token validation failed: ${tokenResult.error}`);
        errors.push(`Native token validation failed: ${tokenResult.error}`);
        allValid = false;
      }
    }

    console.log('');

    if (allValid) {
      console.log('✅ All on-chain validations passed!');
      console.log('📋 On-chain validation summary:');
      console.log('  ✅ Contract existence verified');
      console.log('  ✅ Sequencer address verified');
      if (metadata.nativeToken.type === 'erc20') {
        console.log('  ✅ Native token address verified');
      }
    } else {
      console.error('❌ On-chain validation failed:');
      errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}