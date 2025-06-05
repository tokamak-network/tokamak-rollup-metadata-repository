import { L2RollupMetadata } from '../schemas/rollup-metadata';
import { GITHUB_RAW_BASE_URL } from './constants';

/**
 * Timestamp validation module
 */
export class TimestampValidator {
  /**
   * Validate lastUpdated timestamp for update operations
   */
  public async validateUpdateTimestamp(
    newMetadata: L2RollupMetadata,
    existingFilepath: string,
    operation: 'register' | 'update' = 'update',
  ): Promise<{ valid: boolean; error?: string }> {
    if (operation === 'register') {
      // For register operations, check that file does NOT exist in main branch
      try {
        // Extract the data/ part from the full path
        const dataPath = existingFilepath.includes('data/')
          ? existingFilepath.substring(existingFilepath.indexOf('data/'))
          : existingFilepath;

        const response = await fetch(`${GITHUB_RAW_BASE_URL}${dataPath}`);
        if (response.ok) {
          return {
            valid: false,
            error: `Register operation failed: File already exists in main branch: ${dataPath}`,
          };
        }
        // File doesn't exist in main branch - good for register operation
        return { valid: true };
      } catch (error) {
        // Network error or file doesn't exist - good for register operation
        return { valid: true };
      }
    }

    // For update operations, validate timestamp
    try {
      // Extract the data/ part from the full path
      const dataPath = existingFilepath.includes('data/')
        ? existingFilepath.substring(existingFilepath.indexOf('data/'))
        : existingFilepath;

      const response = await fetch(`${GITHUB_RAW_BASE_URL}${dataPath}`);
      if (!response.ok) {
        return {
          valid: false,
          error: `Update operation failed: File does not exist in main branch: ${dataPath}`,
        };
      }

      const existingContent = await response.text();
      const existingMetadata: L2RollupMetadata = JSON.parse(existingContent);

      const existingTimestamp = new Date(existingMetadata.lastUpdated).getTime();
      const newTimestamp = new Date(newMetadata.lastUpdated).getTime();

      if (newTimestamp <= existingTimestamp) {
        return {
          valid: false,
          error: `Update timestamp must be after existing timestamp. Existing: ${existingMetadata.lastUpdated}, New: ${newMetadata.lastUpdated}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Update timestamp validation failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate timestamp consistency between signature and metadata
   */
  public validateTimestampConsistency(
    metadata: L2RollupMetadata,
    timestamp: number,
    operation: 'register' | 'update',
  ): { valid: boolean; error?: string } {
    try {
      const signatureTimestamp = timestamp;

      if (operation === 'register') {
        // For register operation, check both createdAt and lastUpdated match signature timestamp exactly
        const createdAtTimestamp = Math.floor(new Date(metadata.createdAt).getTime() / 1000);

        // Get lastUpdated (use createdAt as fallback for register operation)
        const lastUpdatedValue = metadata.lastUpdated || metadata.createdAt;
        const lastUpdatedTimestamp = Math.floor(new Date(lastUpdatedValue).getTime() / 1000);

        if (signatureTimestamp !== createdAtTimestamp) {
          return {
            valid: false,
            error: `Timestamp mismatch: signature timestamp (${signatureTimestamp}) must exactly match metadata createdAt timestamp (${createdAtTimestamp}). Please use the same timestamp from signature generation for both signature and metadata createdAt field.`,
          };
        }

        if (signatureTimestamp !== lastUpdatedTimestamp) {
          return {
            valid: false,
            error: `Timestamp mismatch: signature timestamp (${signatureTimestamp}) must exactly match metadata lastUpdated timestamp (${lastUpdatedTimestamp}). Please use the same timestamp from signature generation for both signature and metadata lastUpdated field.`,
          };
        }
      } else {
        // For update operation, only check lastUpdated matches signature timestamp exactly
        if (!metadata.lastUpdated) {
          return {
            valid: false,
            error: 'lastUpdated timestamp is required for update operations',
          };
        }

        const lastUpdatedTimestamp = Math.floor(new Date(metadata.lastUpdated).getTime() / 1000);

        if (signatureTimestamp !== lastUpdatedTimestamp) {
          return {
            valid: false,
            error: `Timestamp mismatch: signature timestamp (${signatureTimestamp}) must exactly match metadata lastUpdated timestamp (${lastUpdatedTimestamp}). Please use the same timestamp from signature generation for both signature and metadata lastUpdated field.`,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Timestamp consistency validation failed: ${(error as Error).message}`,
      };
    }
  }
}

export const timestampValidator = new TimestampValidator();