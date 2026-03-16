import * as fs from 'fs';
import { L2RollupMetadata } from '../schemas/rollup-metadata';
import { TokamakAppchainMetadata, getImmutableFields } from '../schemas/tokamak-appchain-metadata';
import { GITHUB_RAW_BASE_URL } from './constants';

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
        { path: 'l1Contracts.SystemConfig', name: 'SystemConfig address' },
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
  /**
   * Validate immutable fields for appchain metadata during update operations.
   * Fetches existing file from main branch via GitHub raw URL (works in CI).
   */
  public async validateAppchainImmutableFields(
    newMetadata: TokamakAppchainMetadata,
    existingFilepath: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Fetch existing file from the main branch on GitHub
      const dataPath = existingFilepath.includes('tokamak-appchain-data/')
        ? existingFilepath.substring(existingFilepath.indexOf('tokamak-appchain-data/'))
        : existingFilepath;
      const response = await fetch(`${GITHUB_RAW_BASE_URL}${dataPath}`);

      if (!response.ok) {
        if (response.status === 404) {
          // New file — no immutable fields to check
          return { valid: true, errors: [] };
        }
        throw new Error(`Failed to fetch existing file from main branch: ${response.statusText}`);
      }

      const existingContent = await response.text();
      const existingMetadata: TokamakAppchainMetadata = JSON.parse(existingContent);

      const immutableFieldPaths = getImmutableFields(newMetadata.stackType);
      for (const fieldPath of immutableFieldPaths) {
        const existingValue = this.getNestedValue(existingMetadata, fieldPath);
        const newValue = this.getNestedValue(newMetadata, fieldPath);

        if (existingValue !== undefined && JSON.stringify(newValue) !== JSON.stringify(existingValue)) {
          errors.push(
            `Immutable field '${fieldPath}' cannot be changed during update. ` +
            `Existing: ${JSON.stringify(existingValue)}, New: ${JSON.stringify(newValue)}`,
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
}

export const fileValidator = new FileValidator();