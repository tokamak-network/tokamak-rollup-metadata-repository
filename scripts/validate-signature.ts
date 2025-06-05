#!/usr/bin/env node

import path from 'path';
import { readMetadataFile, getFileInfo } from '../src/utils/file-utils';
import { getRpcConfig } from '../src/utils/rpc-config';
import { RollupMetadataValidator } from '../validators/rollup-validator';

/**
 * Signature validation only CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run validate:signature:register <file-path>');
    console.error('       npm run validate:signature:update <file-path>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run validate:signature:register data/sepolia/0x1234567890123456789012345678901234567890.json');
    console.error('  npm run validate:signature:update data/sepolia/0x1234567890123456789012345678901234567890.json');
    console.error('');
    console.error('Environment variables (optional):');
    console.error('  MAINNET_RPC_URL - Custom Ethereum mainnet RPC URL');
    console.error('  SEPOLIA_RPC_URL - Custom Ethereum sepolia RPC URL');
    process.exit(1);
  }

  let operation: 'register' | 'update' | undefined = undefined;
  let filepath: string | undefined = undefined;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--operation' && i + 1 < args.length) {
      const op = args[i + 1];
      if (op === 'register' || op === 'update') {
        operation = op;
      } else {
        console.error(`❌ Invalid operation: ${op}. Must be 'register' or 'update'`);
        process.exit(1);
      }
      i++; // Skip next argument
    } else if (!filepath) {
      filepath = args[i];
    }
  }

  if (!filepath) {
    console.error('❌ File path is required');
    process.exit(1);
  }

  if (!operation) {
    console.error('❌ Operation type is required. Use --operation register or --operation update');
    process.exit(1);
  }

  // Convert relative path to absolute path
  if (!path.isAbsolute(filepath)) {
    filepath = path.resolve(process.cwd(), filepath);
  }

  try {
    console.log(`🔍 Signature validation: ${filepath}`);

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

    // 5. Use explicitly specified operation type
    console.log(`🔄 Operation type: ${operation} (explicitly specified)`);

    console.log('');
    console.log('Running signature validation...');

    // 6. Validate sequencer signature
    console.log('🔐 Checking sequencer signature...');
    const signatureResult = await validator.validateSequencerSignature(metadata, operation);

    if (signatureResult.valid) {
      console.log('✅ Signature validation passed!');
      console.log('📋 Signature validation summary:');
      console.log('  ✅ Signature format is valid');
      console.log('  ✅ Message format is correct');
      console.log('  ✅ Signature matches sequencer address');
      console.log('  ✅ Cryptographic verification successful');

      // Display signature details
      console.log('');
      console.log('📋 Signature Details:');
      console.log(`   Sequencer Address: ${metadata.sequencer.address}`);
      console.log(`   L1 Chain ID: ${metadata.l1ChainId}`);
      console.log(`   L2 Chain ID: ${metadata.l2ChainId}`);
      console.log(`   Operation: ${operation}`);
      console.log(`   Signature: ${metadata.metadata.signature?.substring(0, 20)}...`);
    } else {
      console.error('❌ Signature validation failed:');
      console.error(`  ${signatureResult.error}`);

      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('  1. Ensure the signature was created by the correct sequencer address');
      console.log('  2. Check that the message format matches the expected pattern');
      console.log('  3. Verify L1 and L2 chain IDs are correct');
      console.log(`  4. Ensure signature was created for ${operation} operation`);
      console.log('  5. Check signature timestamp is within 24 hours');
      console.log('  6. For updates: ensure lastUpdated is within 1 hour and after previous');
      console.log('  7. Use the HTML signature tool to generate a valid signature');

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