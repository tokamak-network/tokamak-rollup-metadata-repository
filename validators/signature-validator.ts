import { ethers } from 'ethers';
import { L2RollupMetadata } from '../schemas/rollup-metadata';
import { TokamakAppchainMetadata, getIdentityContractField } from '../schemas/tokamak-appchain-metadata';
import { contractValidator } from './contract-validator';
import { appchainContractValidator } from './appchain-contract-validator';
import { timestampValidator } from './timestamp-validator';

/**
 * Signature validation module
 */
export class SignatureValidator {
  /**
   * Validate sequencer signature (using onchain address)
   */
  public async validateSequencerSignature(
    metadata: L2RollupMetadata,
    operation: 'register' | 'update' = 'register',
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Verify onchain sequencer address
      const onChainValidation = await contractValidator.validateOnChainSequencer(metadata);
      if (!onChainValidation.valid) {
        return {
          valid: false,
          error: `OnChain validation failed: ${onChainValidation.error}`,
        };
      }

      // First, try to verify signature with timestamp (new format)
      let recoveredAddress: string | undefined;
      let timestamp: number | undefined;
      let found = false;

      try {
        // Extract timestamp from signature if present
        const signatureMatch = metadata.metadata.signature.match(/^0x[a-fA-F0-9]{130}$/);
        if (!signatureMatch) {
          return {
            valid: false,
            error: 'Invalid signature format',
          };
        }

        // Try to recover message with timestamp format first
        // Check if this signature was created with timestamp format
        // We'll try both formats and see which one recovers to the correct address
        const timestampMessage = `Tokamak Rollup Registry\nL1 Chain ID: ${metadata.l1ChainId}\nL2 Chain ID: ${metadata.l2ChainId}\nOperation: ${operation}\nSystemConfig: ${metadata.l1Contracts.SystemConfig.toLowerCase()}\nTimestamp: `;
        const legacyMessage = `Tokamak Rollup Registry\nL1 Chain ID: ${metadata.l1ChainId}\nL2 Chain ID: ${metadata.l2ChainId}\nOperation: ${operation}\nSystemConfig: ${metadata.l1Contracts.SystemConfig.toLowerCase()}`;

        // Try legacy format first for backward compatibility
        try {
          const testRecovered = ethers.verifyMessage(legacyMessage, metadata.metadata.signature);
          if (testRecovered.toLowerCase() === metadata.metadata.signedBy.toLowerCase()) {
            recoveredAddress = testRecovered;
            found = true;
          } else {
            throw new Error('Legacy format signature verification failed');
          }
        } catch (legacyError) {
          // Legacy format failed, this should be timestamp format
          // For register: use createdAt timestamp
          // For update: use lastUpdated timestamp

          let expectedTimestamp: number;
          if (operation === 'register') {
            expectedTimestamp = Math.floor(new Date(metadata.createdAt).getTime() / 1000);
          } else {
            if (!metadata.lastUpdated) {
              return {
                valid: false,
                error: 'lastUpdated timestamp is required for update operations',
              };
            }
            expectedTimestamp = Math.floor(new Date(metadata.lastUpdated).getTime() / 1000);
          }

          // Try the expected timestamp first
          const expectedMessage = `${timestampMessage}${expectedTimestamp}`;
          try {
            const testRecovered = ethers.verifyMessage(expectedMessage, metadata.metadata.signature);
            if (testRecovered.toLowerCase() === metadata.metadata.signedBy.toLowerCase()) {
              recoveredAddress = testRecovered;
              timestamp = expectedTimestamp;
              found = true;
            }
          } catch (e) {
            // Exact timestamp failed
            return {
              valid: false,
              error: `Signature verification failed: signature does not match expected timestamp ${expectedTimestamp} (${new Date(expectedTimestamp * 1000).toISOString()}). Please ensure you used the same timestamp for both signature generation and metadata fields.`,
            };
          }

          if (!found) {
            return {
              valid: false,
              error: `Signature verification failed: unable to recover valid message format. Expected timestamp: ${expectedTimestamp} (${new Date(expectedTimestamp * 1000).toISOString()})`,
            };
          }
        }

        // Check timestamp validity (only for new format with timestamp)
        if (timestamp !== undefined) {
          const currentTime = Math.floor(Date.now() / 1000);
          const signatureAge = currentTime - timestamp;
          const maxAge = 86400; // 24 hours for both register and update

          if (signatureAge > maxAge) {
            const hoursExpired = Math.floor(signatureAge / 3600);
            return {
              valid: false,
              error: `Signature expired: signature is ${hoursExpired} hours old, maximum allowed is 24 hours. Please generate a new signature.`,
            };
          }

          if (signatureAge < 0) {
            return {
              valid: false,
              error: 'Signature timestamp cannot be in the future.',
            };
          }

          // Validate timestamp consistency between signature and metadata
          const timestampConsistencyResult = timestampValidator.validateTimestampConsistency(metadata, timestamp, operation);
          if (!timestampConsistencyResult.valid) {
            return {
              valid: false,
              error: timestampConsistencyResult.error!,
            };
          }
        }

      } catch (error) {
        return {
          valid: false,
          error: `Signature verification failed: ${(error as Error).message}`,
        };
      }

      // Ensure recoveredAddress was set
      if (!recoveredAddress) {
        return {
          valid: false,
          error: 'Signature verification failed: unable to recover signer address',
        };
      }

      // Check if recovered address matches metadata signer
      if (recoveredAddress.toLowerCase() !== metadata.metadata.signedBy.toLowerCase()) {
        return {
          valid: false,
          error: 'Signature verification failed: recovered address does not match signedBy',
        };
      }

      // Check if signer matches onchain sequencer
      if (recoveredAddress.toLowerCase() !== onChainValidation.onChainAddress) {
        return {
          valid: false,
          error: `Signature verification failed: signer address (${recoveredAddress.toLowerCase()}) does not match the onchain sequencer address (${onChainValidation.onChainAddress}) from SystemConfig contract. Please ensure the signature was created by the correct sequencer account.`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Signature verification failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate appchain signature (new message format).
   * Message:
   *   Tokamak Appchain Registry
   *   L1 Chain ID: {l1ChainId}
   *   L2 Chain ID: {l2ChainId}
   *   Stack: {stackType}
   *   Operation: {register|update}
   *   Contract: {identityContractAddress_lowercase}
   *   Timestamp: {unixTimestamp}
   */
  public async validateAppchainSignature(
    metadata: TokamakAppchainMetadata,
    operation: 'register' | 'update' = 'register',
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Validate signature format
      if (!metadata.metadata.signature.match(/^0x[a-fA-F0-9]{130}$/)) {
        return {
          valid: false,
          error: 'Invalid signature format: expected 130 hex chars after 0x',
        };
      }

      // Get identity contract address
      const identityField = getIdentityContractField(metadata.stackType);
      const identityAddress = metadata.l1Contracts[identityField];
      if (!identityAddress) {
        return {
          valid: false,
          error: `Missing identity contract: l1Contracts.${identityField}`,
        };
      }

      // Extract expected timestamp
      let expectedTimestamp: number;
      if (operation === 'register') {
        expectedTimestamp = Math.floor(new Date(metadata.createdAt).getTime() / 1000);
      } else {
        expectedTimestamp = Math.floor(new Date(metadata.lastUpdated).getTime() / 1000);
      }

      // Build expected message
      const message = [
        'Tokamak Appchain Registry',
        `L1 Chain ID: ${metadata.l1ChainId}`,
        `L2 Chain ID: ${metadata.l2ChainId}`,
        `Stack: ${metadata.stackType}`,
        `Operation: ${operation}`,
        `Contract: ${identityAddress.toLowerCase()}`,
        `Timestamp: ${expectedTimestamp}`,
      ].join('\n');

      // Recover signer
      let recoveredAddress: string;
      try {
        recoveredAddress = ethers.verifyMessage(message, metadata.metadata.signature);
      } catch {
        return {
          valid: false,
          error: `Signature verification failed: unable to recover signer from message`,
        };
      }

      // Check recovered address matches signedBy
      if (recoveredAddress.toLowerCase() !== metadata.metadata.signedBy.toLowerCase()) {
        return {
          valid: false,
          error: `Signature verification failed: recovered ${recoveredAddress}, expected ${metadata.metadata.signedBy}`,
        };
      }

      // Check timestamp validity (24 hour expiry)
      const currentTime = Math.floor(Date.now() / 1000);
      const signatureAge = currentTime - expectedTimestamp;

      if (signatureAge > 86400) {
        const hoursExpired = Math.floor(signatureAge / 3600);
        return {
          valid: false,
          error: `Signature expired: ${hoursExpired} hours old, max 24h`,
        };
      }

      if (signatureAge < 0) {
        return {
          valid: false,
          error: 'Signature timestamp cannot be in the future',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Appchain signature verification failed: ${(error as Error).message}`,
      };
    }
  }
}

export const signatureValidator = new SignatureValidator();