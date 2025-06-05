#!/usr/bin/env node

import path from 'path';
import { readMetadataFile, getFileInfo } from '../src/utils/file-utils';
import { RollupMetadataValidator } from '../validators/rollup-validator';

/**
 * Schema validation only CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run validate:schema <file-path>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run validate:schema data/sepolia/0x1234567890123456789012345678901234567890.json');
    process.exit(1);
  }

  let filepath = args[0];

  // Convert relative path to absolute path
  if (!path.isAbsolute(filepath)) {
    filepath = path.resolve(process.cwd(), filepath);
  }

  try {
    console.log(`🔍 Schema validation: ${filepath}`);

    // 1. Get file information and check existence
    const fileInfo = await getFileInfo(filepath);
    if (!fileInfo.exists) {
      console.error(`❌ File not found: ${filepath}`);
      process.exit(1);
    }

    // 2. Read and parse metadata
    const metadata = await readMetadataFile(fileInfo.filepath);

    // 3. Setup validator
    const validator = new RollupMetadataValidator();

    // 4. Run schema validation only
    const result = validator.validateSchema(metadata);

    if (result.valid) {
      console.log('✅ Schema validation passed!');
      console.log('📋 Schema validation summary:');
      console.log('  ✅ JSON structure is valid');
      console.log('  ✅ Required fields are present');
      console.log('  ✅ Field types are correct');
      console.log('  ✅ Field formats are valid');
    } else {
      console.error('❌ Schema validation failed:');
      if (result.errors) {
        result.errors.forEach((error, index) => {
          // Type guard for error object
          if (error && typeof error === 'object' && 'instancePath' in error && 'message' in error) {
            const validationError = error as { instancePath?: string; message: string };
            console.error(`  ${index + 1}. ${validationError.instancePath || 'root'}: ${validationError.message}`);
          } else {
            console.error(`  ${index + 1}. ${JSON.stringify(error)}`);
          }
        });
      }
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