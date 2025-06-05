import { L2RollupMetadata } from '../schemas/rollup-metadata';

/**
 * File validation module
 */
export class FileValidator {
  /**
   * Validate file existence for register vs update operations
   */
  public validateFileExistenceForOperation(
    filepath: string,
    operation: 'register' | 'update',
  ): { valid: boolean; error?: string } {
    // Note: File existence validation is now handled by GitHub Actions
    // which properly compares with the main branch to determine if a file
    // is newly added (register) or modified (update).
    //
    // This validation is kept for compatibility but should not fail
    // based on local filesystem state since that creates a catch-22
    // where new rollups cannot be registered.

    // Keep parameters for API compatibility
    void filepath;
    void operation;

    return { valid: true };
  }

  /**
   * Validate immutable fields during update operations
   */
  public validateImmutableFields(
    newMetadata: L2RollupMetadata,
    existingFilepath: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fs = require('fs');

    try {
      if (!fs.existsSync(existingFilepath)) {
        // If file doesn't exist, this validation doesn't apply
        return { valid: true, errors: [] };
      }

      const existingContent = fs.readFileSync(existingFilepath, 'utf8');
      const existingMetadata: L2RollupMetadata = JSON.parse(existingContent);

      // Define immutable fields that cannot be changed during updates
      const immutableFields = [
        { path: 'l1ChainId', name: 'L1 Chain ID' },
        { path: 'l2ChainId', name: 'L2 Chain ID' },
        { path: 'l1Contracts.systemConfig', name: 'SystemConfig address' },
        { path: 'rollupType', name: 'Rollup type' },
        { path: 'stack.name', name: 'Stack name' },
        { path: 'createdAt', name: 'Creation timestamp' },
      ];

      // Check each immutable field
      for (const field of immutableFields) {
        const existingValue = this.getNestedValue(existingMetadata, field.path);
        const newValue = this.getNestedValue(newMetadata, field.path);

        if (existingValue !== undefined && newValue !== existingValue) {
          errors.push(
            `Immutable field '${field.name}' cannot be changed during update. ` +
            `Existing: ${existingValue}, New: ${newValue}`,
          );
        }
      }

      // Special validation for staking candidate registration
      if (existingMetadata.staking.isCandidate && existingMetadata.staking.registrationTxHash) {
        if (newMetadata.staking.registrationTxHash !== existingMetadata.staking.registrationTxHash) {
          errors.push(
            'Staking registration transaction hash cannot be changed during update. ' +
            `Existing: ${existingMetadata.staking.registrationTxHash}, New: ${newMetadata.staking.registrationTxHash}`,
          );
        }
        if (newMetadata.staking.candidateAddress !== existingMetadata.staking.candidateAddress) {
          errors.push(
            'Staking candidate address cannot be changed during update. ' +
            `Existing: ${existingMetadata.staking.candidateAddress}, New: ${newMetadata.staking.candidateAddress}`,
          );
        }
      }

    } catch (error) {
      errors.push(`Failed to validate immutable fields: ${(error as Error).message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Helper function to get nested object values using dot notation
   */
  public getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && current !== null && key in current ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }
}

export const fileValidator = new FileValidator();