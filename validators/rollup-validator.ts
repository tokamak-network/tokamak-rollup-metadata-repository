import { L2RollupMetadata } from '../schemas/rollup-metadata';
import { getRpcProviderForChainId } from './constants';

// Import modular validators
import { schemaValidator } from './schema-validator';
import { addressValidator } from './address-validator';
import { contractValidator } from './contract-validator';
import { networkValidator } from './network-validator';
import { timestampValidator } from './timestamp-validator';
import { signatureValidator } from './signature-validator';
import { fileValidator } from './file-validator';

/**
 * Main rollup metadata validator that orchestrates all validation modules
 */
export class RollupMetadataValidator {
  /**
   * Set RPC provider for contract validation
   */
  public setProvider(rpcUrl: string): void {
    contractValidator.setProvider(rpcUrl);
  }

  /**
   * Automatically set RPC provider based on L1 chain ID
   */
  public setProviderForChainId(chainId: number): void {
    const rpcUrl = getRpcProviderForChainId(chainId);
    this.setProvider(rpcUrl);
  }

  /**
   * JSON schema validation
   */
  public validateSchema(metadata: unknown): { valid: boolean; errors?: unknown[] } {
    return schemaValidator.validateSchema(metadata);
  }

  /**
   * Ethereum address format validation
   */
  public isValidAddress(address: string): boolean {
    return addressValidator.isValidAddress(address);
  }

  /**
   * Validate filename matches SystemConfig address
   */
  public validateFilename(filename: string, systemConfigAddress: string): boolean {
    return addressValidator.validateFilename(filename, systemConfigAddress);
  }

  /**
   * Validate network and file path match
   */
  public validateNetworkPath(filepath: string, network: string): boolean {
    return networkValidator.validateNetworkPath(filepath, network);
  }

  /**
   * Extract network from file path
   */
  public extractNetworkFromPath(filepath: string): string | null {
    return networkValidator.extractNetworkFromPath(filepath);
  }

  /**
   * Validate network consistency between file path and chainId
   */
  public validateNetworkChainIdConsistency(network: string, chainId: number): { valid: boolean; error?: string } {
    return networkValidator.validateNetworkChainIdConsistency(network, chainId);
  }

  /**
   * Parse and validate PR title
   */
  public parsePRTitle(title: string): {
    valid: boolean;
    network?: string;
    systemConfigAddress?: string;
    rollupName?: string;
    operation?: 'register' | 'update';
    error?: string;
  } {
    return networkValidator.parsePRTitle(title);
  }

  /**
   * Validate that a contract is deployed at the given address
   */
  public async validateContractExistence(contractAddress: string): Promise<{ valid: boolean; error?: string }> {
    return contractValidator.validateContractExistence(contractAddress);
  }

  /**
   * Get actual sequencer address from SystemConfig contract
   */
  public async getOnChainSequencerAddress(systemConfigAddress: string): Promise<string | null> {
    return contractValidator.getOnChainSequencerAddress(systemConfigAddress);
  }

  /**
   * Validate onchain sequencer address matches metadata sequencer address
   */
  public async validateOnChainSequencer(
    metadata: L2RollupMetadata,
  ): Promise<{ valid: boolean; error?: string; onChainAddress?: string }> {
    return contractValidator.validateOnChainSequencer(metadata);
  }

  /**
   * Validate sequencer signature (using onchain address)
   */
  public async validateSequencerSignature(
    metadata: L2RollupMetadata,
    operation: 'register' | 'update' = 'register',
  ): Promise<{ valid: boolean; error?: string }> {
    return signatureValidator.validateSequencerSignature(metadata, operation);
  }

  /**
   * Validate native token address consistency for ERC20 tokens
   */
  public async validateNativeTokenAddress(
    metadata: L2RollupMetadata,
  ): Promise<{ valid: boolean; error?: string }> {
    return contractValidator.validateNativeTokenAddress(metadata);
  }

  /**
   * Validate staking registration transaction and candidate address
   */
  public async validateStakingRegistration(
    metadata: L2RollupMetadata,
    layer2ManagerAddress: string,
  ): Promise<{ valid: boolean; error?: string }> {
    return contractValidator.validateStakingRegistration(metadata, layer2ManagerAddress);
  }

  /**
   * Validate file existence for register vs update operations
   */
  public validateFileExistenceForOperation(
    filepath: string,
    operation: 'register' | 'update',
  ): { valid: boolean; error?: string } {
    return fileValidator.validateFileExistenceForOperation(filepath, operation);
  }

  /**
   * Validate immutable fields during update operations
   */
  public validateImmutableFields(
    newMetadata: L2RollupMetadata,
    existingFilepath: string,
  ): { valid: boolean; errors: string[] } {
    return fileValidator.validateImmutableFields(newMetadata, existingFilepath);
  }

  /**
   * Validate lastUpdated timestamp for update operations
   */
  public async validateUpdateTimestamp(
    newMetadata: L2RollupMetadata,
    existingFilepath: string,
    operation: 'register' | 'update' = 'update',
  ): Promise<{ valid: boolean; error?: string }> {
    return timestampValidator.validateUpdateTimestamp(newMetadata, existingFilepath, operation);
  }

  /**
   * Validate timestamp consistency between signature and metadata
   */
  public validateTimestampConsistency(
    metadata: L2RollupMetadata,
    timestamp: number,
    operation: 'register' | 'update',
  ): { valid: boolean; error?: string } {
    return timestampValidator.validateTimestampConsistency(metadata, timestamp, operation);
  }

  /**
   * Helper function to get nested object values using dot notation
   */
  public getNestedValue(obj: unknown, path: string): unknown {
    return fileValidator.getNestedValue(obj, path);
  }

  /**
   * Complete metadata validation
   */
  public async validateRollupMetadata(
    metadata: L2RollupMetadata,
    filepath: string,
    prTitle?: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    let operation: 'register' | 'update' = 'register'; // default to register

    // Automatically set provider based on L1 chain ID
    this.setProviderForChainId(metadata.l1ChainId);

    // Extract network from file path
    const networkFromPath = this.extractNetworkFromPath(filepath);
    if (!networkFromPath) {
      errors.push(`Could not extract network from file path: ${filepath}`);
    }

    // 1. JSON schema validation
    const schemaResult = this.validateSchema(metadata);
    if (!schemaResult.valid) {
      errors.push(`Schema validation failed: ${JSON.stringify(schemaResult.errors, null, 2)}`);
    }

    // 2. PR title validation (if provided)
    if (prTitle) {
      const prResult = this.parsePRTitle(prTitle);
      if (!prResult.valid) {
        errors.push(prResult.error!);
      } else {
        // Extract operation from PR title
        operation = prResult.operation!;

        // Verify SystemConfig address match
        if (prResult.systemConfigAddress !== metadata.l1Contracts.SystemConfig?.toLowerCase()) {
          errors.push(`PR title SystemConfig address (${prResult.systemConfigAddress}) does not match metadata SystemConfig address (${metadata.l1Contracts.SystemConfig})`);
        }

        // Verify network match (now always provided in PR title)
        if (prResult.network && networkFromPath && prResult.network !== networkFromPath) {
          errors.push(`PR title network (${prResult.network}) does not match file path network (${networkFromPath})`);
        }

        // Verify rollup name match (now always provided in PR title)
        if (prResult.rollupName && prResult.rollupName !== metadata.name) {
          errors.push(`PR title rollup name (${prResult.rollupName}) does not match metadata name (${metadata.name})`);
        }
      }
    }

    // 3. Filename validation
    const filename = filepath.split('/').pop() || '';
    if (metadata.l1Contracts.SystemConfig && !this.validateFilename(filename, metadata.l1Contracts.SystemConfig)) {
      errors.push(`Filename should be ${metadata.l1Contracts.SystemConfig.toLowerCase()}.json, got ${filename}`);
    }

    // 4. Onchain sequencer validation and signature verification with dynamic operation
    const signatureResult = await this.validateSequencerSignature(metadata, operation);
    if (!signatureResult.valid) {
      errors.push(signatureResult.error!);
    }

    // 5. Contract address format validation
    const contractAddressResult = addressValidator.validateContractAddresses(
      metadata.l1Contracts,
      metadata.l2Contracts,
      metadata.sequencer.address,
    );
    if (!contractAddressResult.valid) {
      errors.push(...contractAddressResult.errors);
    }

    // 6. Native token validation
    if (metadata.nativeToken.type === 'erc20') {
      if (!metadata.nativeToken.l1Address) {
        errors.push('ERC20 native token requires l1Address');
      } else if (!this.isValidAddress(metadata.nativeToken.l1Address)) {
        errors.push(`Invalid ERC20 native token L1 address: ${metadata.nativeToken.l1Address}`);
      }
    }

    // 7. Native token address consistency validation (ERC20 only)
    const nativeTokenResult = await this.validateNativeTokenAddress(metadata);
    if (!nativeTokenResult.valid) {
      errors.push(nativeTokenResult.error!);
    }

    // 8. Network chainId consistency validation
    if (networkFromPath) {
      const chainIdConsistencyResult = this.validateNetworkChainIdConsistency(networkFromPath, metadata.l1ChainId);
      if (!chainIdConsistencyResult.valid) {
        errors.push(chainIdConsistencyResult.error!);
      }
    }

    // 9. File existence validation for register vs update operations
    const fileExistenceResult = this.validateFileExistenceForOperation(filepath, operation);
    if (!fileExistenceResult.valid) {
      errors.push(fileExistenceResult.error!);
    }

    // 10. Immutable fields validation during update operations
    if (operation === 'update') {
      const immutableFieldsResult = this.validateImmutableFields(metadata, filepath);
      if (!immutableFieldsResult.valid) {
        errors.push(...immutableFieldsResult.errors);
      }

      // Additional validation for update operations: check lastUpdated timestamp
      const updateTimestampResult = await this.validateUpdateTimestamp(metadata, filepath, operation);
      if (!updateTimestampResult.valid) {
        errors.push(updateTimestampResult.error!);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const rollupValidator = new RollupMetadataValidator();
