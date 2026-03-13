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
      i++;
    } else if (!filePath) {
      filePath = args[i];
    }
  }

  if (!filePath) {
    console.error('Usage: npm run validate:appchain -- [--pr-title "PR Title"] <metadata-file-path>');
    console.error('Example: npm run validate:appchain -- --pr-title "[Appchain] 11155111/tokamak-appchain 0x1234...abcd - My Appchain" tokamak-appchain-data/11155111/tokamak-appchain/0x1234567890123456789012345678901234567890.json');
    console.error('');
    console.error('Environment variables (optional):');
    console.error('  L1_RPC_{chainId} - Custom L1 RPC URL for the specified chain ID');
    console.error('  Example: L1_RPC_11155111=https://sepolia.infura.io/v3/YOUR_KEY');
    process.exit(1);
  }

  return { prTitle, filePath };
}

async function main() {
  const { prTitle, filePath } = parseArgs();

  console.log('🔍 Validating Tokamak Appchain Metadata...');
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

if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  });
}
