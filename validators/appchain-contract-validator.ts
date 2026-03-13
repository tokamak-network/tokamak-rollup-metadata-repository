import { ethers } from 'ethers';
import {
  type TokamakAppchainMetadata,
  getIdentityContractField,
} from '../schemas/tokamak-appchain-metadata';
import {
  ON_CHAIN_PROPOSER_ABI,
  TIMELOCK_ABI,
  SYSTEM_CONFIG_ABI,
} from './constants';
import { getRpcForChainId } from '../src/utils/rpc-config';

const L1_RPC_TIMEOUT = 15_000;
const L2_RPC_TIMEOUT = 10_000;

/**
 * On-chain contract validator for appchain metadata.
 * Verifies contract existence, ownership, and L2 chain ID per stack type.
 */
export class AppchainContractValidator {
  private provider: ethers.JsonRpcProvider | null = null;

  /**
   * Set L1 RPC provider for the given chain ID.
   */
  public setProviderForChainId(chainId: number): void {
    const rpcConfig = getRpcForChainId(chainId);
    this.provider = new ethers.JsonRpcProvider(rpcConfig.url);
  }

  /**
   * Verify a contract exists at the given address on L1.
   */
  public async validateContractExistence(
    address: string,
    chainId: number,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.provider) {
        this.setProviderForChainId(chainId);
      }
      const code = await Promise.race([
        this.provider!.getCode(address),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), L1_RPC_TIMEOUT),
        ),
      ]);

      if (code === '0x' || code === '0x0') {
        return {
          valid: false,
          error: `No contract deployed at address ${address} on chain ${chainId}`,
        };
      }
      return { valid: true };
    } catch (err: any) {
      if (err.message === 'timeout') {
        return {
          valid: false,
          error: `L1 RPC call to chain ${chainId} timed out after ${L1_RPC_TIMEOUT / 1000}s`,
        };
      }
      return {
        valid: false,
        error: `Failed to check contract at ${address}: ${err.message}`,
      };
    }
  }

  /**
   * Stack-specific on-chain ownership verification.
   */
  public async validateOwnership(
    metadata: TokamakAppchainMetadata,
  ): Promise<{ valid: boolean; error?: string; onChainOwner?: string }> {
    if (!this.provider) {
      this.setProviderForChainId(metadata.l1ChainId);
    }

    switch (metadata.stackType) {
      case 'tokamak-appchain':
        return this.validateTokamakAppchainOwnership(metadata);
      case 'thanos':
        return this.validateThanosOwnership(metadata);
      case 'tokamak-private-app-channel':
      case 'py-ethclient':
        // No specific ownership verification until identity contracts are defined
        return { valid: true };
      default:
        return { valid: false, error: `Unknown stack type: ${metadata.stackType}` };
    }
  }

  /**
   * tokamak-appchain: OnChainProposer.owner() → Timelock.admin() or direct owner
   */
  private async validateTokamakAppchainOwnership(
    metadata: TokamakAppchainMetadata,
  ): Promise<{ valid: boolean; error?: string; onChainOwner?: string }> {
    const proposerAddress = metadata.l1Contracts['OnChainProposer'];
    if (!proposerAddress) {
      return { valid: false, error: 'Missing l1Contracts.OnChainProposer' };
    }

    try {
      const contract = new ethers.Contract(proposerAddress, ON_CHAIN_PROPOSER_ABI, this.provider!);
      const owner: string = await Promise.race([
        contract.owner(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), L1_RPC_TIMEOUT),
        ),
      ]);

      // Check if owner is a Timelock (has admin() function)
      let finalOwner = owner;
      try {
        const timelockContract = new ethers.Contract(owner, TIMELOCK_ABI, this.provider!);
        const admin: string = await Promise.race([
          timelockContract.admin(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), L1_RPC_TIMEOUT),
          ),
        ]);
        finalOwner = admin;
      } catch {
        // Not a Timelock — owner is the direct owner
      }

      if (finalOwner.toLowerCase() !== metadata.metadata.signedBy.toLowerCase()) {
        return {
          valid: false,
          error: `Signer ${metadata.metadata.signedBy} does not match OnChainProposer owner chain. On-chain owner: ${finalOwner}`,
          onChainOwner: finalOwner,
        };
      }

      return { valid: true, onChainOwner: finalOwner };
    } catch (err: any) {
      if (err.message === 'timeout') {
        return {
          valid: false,
          error: `L1 RPC call timed out while checking OnChainProposer.owner()`,
        };
      }
      return {
        valid: false,
        error: `Failed to call owner() on OnChainProposer: ${err.message}`,
      };
    }
  }

  /**
   * thanos: SystemConfig.unsafeBlockSigner() must match signedBy
   */
  private async validateThanosOwnership(
    metadata: TokamakAppchainMetadata,
  ): Promise<{ valid: boolean; error?: string; onChainOwner?: string }> {
    const systemConfigAddress = metadata.l1Contracts['SystemConfig'];
    if (!systemConfigAddress) {
      return { valid: false, error: 'Missing l1Contracts.SystemConfig' };
    }

    try {
      const contract = new ethers.Contract(systemConfigAddress, SYSTEM_CONFIG_ABI, this.provider!);
      const signer: string = await Promise.race([
        contract.unsafeBlockSigner(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), L1_RPC_TIMEOUT),
        ),
      ]);

      if (signer.toLowerCase() !== metadata.metadata.signedBy.toLowerCase()) {
        return {
          valid: false,
          error: `Signer ${metadata.metadata.signedBy} does not match SystemConfig.unsafeBlockSigner(). On-chain: ${signer}`,
          onChainOwner: signer,
        };
      }

      // Validate native token address if ERC20
      if (metadata.nativeToken.type === 'erc20' && metadata.nativeToken.l1Address) {
        const nativeTokenAddress: string = await contract.nativeTokenAddress();
        if (nativeTokenAddress.toLowerCase() !== metadata.nativeToken.l1Address.toLowerCase()) {
          return {
            valid: false,
            error: `Native token address mismatch: metadata says ${metadata.nativeToken.l1Address}, on-chain says ${nativeTokenAddress}`,
          };
        }
      }

      return { valid: true, onChainOwner: signer };
    } catch (err: any) {
      if (err.message === 'timeout') {
        return {
          valid: false,
          error: `L1 RPC call timed out while checking SystemConfig.unsafeBlockSigner()`,
        };
      }
      return {
        valid: false,
        error: `Failed to call unsafeBlockSigner() on SystemConfig: ${err.message}`,
      };
    }
  }

  /**
   * Validate L2 chain ID by calling eth_chainId on the provided RPC URL.
   */
  public async validateL2ChainId(
    metadata: TokamakAppchainMetadata,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const l2Provider = new ethers.JsonRpcProvider(metadata.rpcUrl);
      const network = await Promise.race([
        l2Provider.getNetwork(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), L2_RPC_TIMEOUT),
        ),
      ]);

      const actualChainId = Number(network.chainId);
      if (actualChainId !== metadata.l2ChainId) {
        return {
          valid: false,
          error: `L2 chain ID mismatch: metadata says ${metadata.l2ChainId}, RPC reports ${actualChainId}`,
        };
      }

      return { valid: true };
    } catch (err: any) {
      if (err.message === 'timeout') {
        return {
          valid: false,
          error: `L2 RPC at ${metadata.rpcUrl} is unreachable (timeout ${L2_RPC_TIMEOUT / 1000}s)`,
        };
      }
      return {
        valid: false,
        error: `L2 RPC error at ${metadata.rpcUrl}: ${err.message}`,
      };
    }
  }

  /**
   * Full contract validation: existence + ownership + L2 chain ID.
   */
  public async validateContracts(
    metadata: TokamakAppchainMetadata,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    this.setProviderForChainId(metadata.l1ChainId);

    // 1. Identity contract existence
    const identityField = getIdentityContractField(metadata.stackType);
    const identityAddress = metadata.l1Contracts[identityField];
    if (!identityAddress) {
      errors.push(`Missing identity contract: l1Contracts.${identityField}`);
      return { valid: false, errors };
    }

    const existenceResult = await this.validateContractExistence(identityAddress, metadata.l1ChainId);
    if (!existenceResult.valid) {
      errors.push(existenceResult.error!);
    }

    // 2. On-chain ownership verification
    const ownershipResult = await this.validateOwnership(metadata);
    if (!ownershipResult.valid) {
      errors.push(ownershipResult.error!);
    }

    // 3. L2 chain ID verification (non-blocking for updates — warn only)
    const l2ChainIdResult = await this.validateL2ChainId(metadata);
    if (!l2ChainIdResult.valid) {
      // L2 RPC failures are warnings for updates, errors for registration
      errors.push(l2ChainIdResult.error!);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const appchainContractValidator = new AppchainContractValidator();
