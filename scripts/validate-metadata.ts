#!/usr/bin/env ts-node

import { validateRollupFile, displayValidationResults, ValidationOptions } from '../src/utils/validation-runner';

interface CLIArgs {
  prTitle?: string;
  filePath: string;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  let prTitle: string | undefined;
  let filePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pr-title' && i + 1 < args.length) {
      prTitle = args[i + 1];
      i++; // skip next arg as it's the value
    } else if (!filePath) {
      filePath = args[i];
    }
  }

  if (!filePath) {
    console.error('Usage: npm run validate -- [--pr-title "PR Title"] <metadata-file-path>');
    console.error('Example: npm run validate -- --pr-title "[Rollup] sepolia - 12345 - Example L2" data/sepolia/0x1234567890123456789012345678901234567890.json');
    console.error('');
    console.error('Environment variables (optional):');
    console.error('  MAINNET_RPC_URL - Custom Ethereum mainnet RPC URL (default: public RPC)');
    console.error('  SEPOLIA_RPC_URL - Custom Ethereum sepolia RPC URL (default: public RPC)');
    process.exit(1);
  }

  return { prTitle, filePath };
}

// Main execution
async function main() {
  const { prTitle, filePath } = parseArgs();

  console.log('🔍 Validating Tokamak Rollup Metadata...');
  console.log(`File: ${filePath}`);
  if (prTitle) {
    console.log(`PR Title: ${prTitle}`);
  }
  console.log('');

  try {
    const options: ValidationOptions = { prTitle, verbose: true };
    const result = await validateRollupFile(filePath, options);

    displayValidationResults(result, true);

    if (result.valid) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Only call main function if script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  });
}