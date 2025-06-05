import { ethers, JsonRpcProvider, Contract } from 'ethers';
import { L2RollupMetadata } from '../schemas/rollup-metadata';
import { SYSTEM_CONFIG_ABI, LAYER2_MANAGER_ABI } from './constants';

/**
 * Contract validation module
 */
export class ContractValidator {
  private provider: JsonRpcProvider | null = null;

  /**
   * Set RPC provider
   */
  public setProvider(rpcUrl: string): void {
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  /**
   * Validate that a contract is deployed at the given address
   */
  public async validateContractExistence(contractAddress: string): Promise<{ valid: boolean; error?: string }> {
    if (!this.provider) {
      return {
        valid: false,
        error: 'RPC provider not set. Call setProvider() first.',
      };
    }

    try {
      const code = await this.provider.getCode(contractAddress);

      if (code === '0x' || code === '0x0') {
        return {
          valid: false,
          error: `No contract deployed at address: ${contractAddress}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to check contract existence: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get actual sequencer address from SystemConfig contract
   */
  public async getOnChainSequencerAddress(systemConfigAddress: string): Promise<string | null> {
    if (!this.provider) {
      throw new Error('RPC provider not set. Call setProvider() first.');
    }

    try {
      const systemConfigContract = new Contract(
        systemConfigAddress,
        SYSTEM_CONFIG_ABI,
        this.provider,
      );

      const sequencerAddress = await systemConfigContract.unsafeBlockSigner();
      return sequencerAddress.toLowerCase();
    } catch (error) {
      console.error(`Failed to get sequencer address from SystemConfig ${systemConfigAddress}:`, error);
      return null;
    }
  }

  /**
   * Validate onchain sequencer address matches metadata sequencer address
   */
  public async validateOnChainSequencer(
    metadata: L2RollupMetadata,
  ): Promise<{ valid: boolean; error?: string; onChainAddress?: string }> {
    if (!metadata.l1Contracts.systemConfig) {
      return {
        valid: false,
        error: 'SystemConfig address is required for sequencer validation',
      };
    }

    // First, check if contract exists
    const contractExistenceResult = await this.validateContractExistence(
      metadata.l1Contracts.systemConfig,
    );
    if (!contractExistenceResult.valid) {
      return {
        valid: false,
        error: contractExistenceResult.error,
      };
    }

    try {
      const onChainSequencerAddress = await this.getOnChainSequencerAddress(
        metadata.l1Contracts.systemConfig,
      );

      if (!onChainSequencerAddress) {
        return {
          valid: false,
          error: 'Failed to fetch sequencer address from SystemConfig contract',
        };
      }

      const metadataSequencerAddress = metadata.sequencer.address.toLowerCase();

      if (onChainSequencerAddress !== metadataSequencerAddress) {
        return {
          valid: false,
          error: `Sequencer address mismatch. OnChain: ${onChainSequencerAddress}, Metadata: ${metadataSequencerAddress}`,
          onChainAddress: onChainSequencerAddress,
        };
      }

      return {
        valid: true,
        onChainAddress: onChainSequencerAddress,
      };
    } catch (error) {
      return {
        valid: false,
        error: `OnChain sequencer validation failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate native token address consistency for ERC20 tokens
   */
  public async validateNativeTokenAddress(
    metadata: L2RollupMetadata,
  ): Promise<{ valid: boolean; error?: string }> {
    // Skip validation for ETH native tokens
    if (metadata.nativeToken.type === 'eth') {
      return { valid: true };
    }

    // Only validate ERC20 tokens
    if (metadata.nativeToken.type !== 'erc20' || !metadata.nativeToken.l1Address) {
      return { valid: true }; // Schema validation will catch missing l1Address for ERC20
    }

    if (!this.provider) {
      return {
        valid: false,
        error: 'RPC provider not set. Call setProvider() first.',
      };
    }

    try {
      const systemConfigContract = new Contract(
        metadata.l1Contracts.systemConfig,
        SYSTEM_CONFIG_ABI,
        this.provider,
      );

      const onChainNativeTokenAddress = await systemConfigContract.nativeTokenAddress();
      const normalizedOnChain = onChainNativeTokenAddress.toLowerCase();
      const normalizedMetadata = metadata.nativeToken.l1Address.toLowerCase();

      if (normalizedOnChain !== normalizedMetadata) {
        return {
          valid: false,
          error: `Native token address mismatch. SystemConfig.nativeTokenAddress(): ${normalizedOnChain}, Metadata nativeToken.l1Address: ${normalizedMetadata}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Native token address validation failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate staking registration transaction and candidate address
   */
  public async validateStakingRegistration(
    metadata: L2RollupMetadata,
    layer2ManagerAddress: string,
  ): Promise<{ valid: boolean; error?: string }> {
    if (!metadata.staking.isCandidate) {
      return { valid: true }; // No validation needed if not a candidate
    }

    if (!metadata.staking.registrationTxHash || !metadata.staking.candidateAddress) {
      return {
        valid: false,
        error: 'Registration transaction hash and candidate address are required when isCandidate is true',
      };
    }

    if (!this.provider) {
      return {
        valid: false,
        error: 'RPC provider not set. Call setProvider() first.',
      };
    }

    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(metadata.staking.registrationTxHash);
      if (!receipt) {
        return {
          valid: false,
          error: `Transaction not found: ${metadata.staking.registrationTxHash}`,
        };
      }

      // Check if transaction was sent to Layer2ManagerProxy
      if (receipt.to?.toLowerCase() !== layer2ManagerAddress.toLowerCase()) {
        return {
          valid: false,
          error: `Transaction was not sent to Layer2ManagerProxy (${layer2ManagerAddress}), got: ${receipt.to}`,
        };
      }

      // Get transaction data to verify function call
      const tx = await this.provider.getTransaction(metadata.staking.registrationTxHash);
      if (!tx) {
        return {
          valid: false,
          error: `Transaction details not found: ${metadata.staking.registrationTxHash}`,
        };
      }

      // Decode transaction data to verify registerCandidateAddOn function call
      const iface = new ethers.Interface(LAYER2_MANAGER_ABI);
      let decodedData;
      try {
        decodedData = iface.parseTransaction({ data: tx.data, value: tx.value });
      } catch (error) {
        return {
          valid: false,
          error: 'Failed to decode transaction data. Expected registerCandidateAddOn function call.',
        };
      }

      if (!decodedData || decodedData.name !== 'registerCandidateAddOn') {
        return {
          valid: false,
          error: `Expected registerCandidateAddOn function call, got: ${decodedData?.name || 'unknown'}`,
        };
      }

      // Verify rollupConfig parameter matches SystemConfig address
      const rollupConfigParam = decodedData.args[0]; // first parameter
      if (rollupConfigParam.toLowerCase() !== metadata.l1Contracts.systemConfig.toLowerCase()) {
        return {
          valid: false,
          error: `rollupConfig parameter (${rollupConfigParam}) does not match SystemConfig address (${metadata.l1Contracts.systemConfig})`,
        };
      }

      // Parse logs to find RegisteredCandidateAddOn event
      const registeredEvent = receipt.logs.find(log => {
        try {
          const parsedLog = iface.parseLog({ topics: log.topics, data: log.data });
          return parsedLog?.name === 'RegisteredCandidateAddOn';
        } catch {
          return false;
        }
      });

      if (!registeredEvent) {
        return {
          valid: false,
          error: 'RegisteredCandidateAddOn event not found in transaction logs',
        };
      }

      // Decode the event to get candidateAddOn address
      const parsedEvent = iface.parseLog({ topics: registeredEvent.topics, data: registeredEvent.data });
      if (!parsedEvent) {
        return {
          valid: false,
          error: 'Failed to parse RegisteredCandidateAddOn event',
        };
      }

      const eventCandidateAddress = parsedEvent.args.candidateAddOn;

      // Verify candidate address matches event
      if (eventCandidateAddress.toLowerCase() !== metadata.staking.candidateAddress.toLowerCase()) {
        return {
          valid: false,
          error: `candidateAddress (${metadata.staking.candidateAddress}) does not match event candidateAddOn (${eventCandidateAddress})`,
        };
      }

      // Verify event rollupConfig matches SystemConfig
      const eventRollupConfig = parsedEvent.args.rollupConfig;
      if (eventRollupConfig.toLowerCase() !== metadata.l1Contracts.systemConfig.toLowerCase()) {
        return {
          valid: false,
          error: `Event rollupConfig (${eventRollupConfig}) does not match SystemConfig address (${metadata.l1Contracts.systemConfig})`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Staking registration validation failed: ${(error as Error).message}`,
      };
    }
  }
}

export const contractValidator = new ContractValidator();