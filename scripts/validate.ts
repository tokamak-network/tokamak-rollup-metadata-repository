#!/usr/bin/env node

import path from 'path';
import { validateRollupFile, displayValidationResults, ValidationOptions } from '../src/utils/validation-runner';

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run validate [--pr-title "title"] <file-path>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run validate data/sepolia/0x1234567890123456789012345678901234567890.json');
    console.error('  npm run validate --pr-title "[Rollup] sepolia - 0x1234...7890 - My L2" data/sepolia/0x1234567890123456789012345678901234567890.json');
    console.error('');
    console.error('Environment variables (optional):');
    console.error('  MAINNET_RPC_URL - Custom Ethereum mainnet RPC URL (default: public RPC)');
    console.error('  SEPOLIA_RPC_URL - Custom Ethereum sepolia RPC URL (default: public RPC)');
    console.error('');
    console.error('Note: Public RPCs are used by default. Set environment variables for higher rate limits.');
    process.exit(1);
  }

  let prTitle: string | undefined = undefined;
  let filepath: string | undefined = undefined;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pr-title' && i + 1 < args.length) {
      prTitle = args[i + 1];
      i++; // Skip next argument
    } else if (!filepath) {
      filepath = args[i];
    }
  }

  if (!filepath) {
    console.error('❌ File path is required');
    process.exit(1);
  }

  // Convert relative path to absolute path
  if (!path.isAbsolute(filepath)) {
    filepath = path.resolve(process.cwd(), filepath);
  }

  try {
    const options: ValidationOptions = { prTitle, verbose: true };
    const result = await validateRollupFile(filepath, options);

    displayValidationResults(result, true);

    if (!result.valid) {
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