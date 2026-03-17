import { ethers } from 'ethers';
import {
  type TokamakAppchainMetadata,
  getIdentityContractField,
} from '../schemas/tokamak-appchain-metadata';
import {
  TIMELOCK_ABI,
  SECURITY_COUNCIL_ROLE,
} from './constants';
import { getRpcForChainId } from '../src/utils/rpc-config';

const L1_RPC_TIMEOUT = 15_000;
const L2_RPC_TIMEOUT = 10_000;

/**
 * Race a promise against a timeout, clearing the timer on resolution.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout: ${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * On-chain contract validator for appchain metadata.
 * Verifies contract existence, ownership, and L2 chain ID per stack type.
 */
export class AppchainContractValidator {
  private provider: ethers.JsonRpcProvider | null = null;
  private currentChainId: number | null = null;

  /**
   * Set L1 RPC provider for the given chain ID.
   * Reuses existing provider if chain ID hasn't changed; destroys old provider otherwise.
   */
  public setProviderForChainId(chainId: number): void {
    if (this.currentChainId === chainId && this.provider) return;
    this.provider?.destroy();
    const rpcConfig = getRpcForChainId(chainId);
    this.provider = new ethers.JsonRpcProvider(rpcConfig.url);
    this.currentChainId = chainId;
  }

  /**
   * Destroy the L1 provider and reset state.
   */
  public destroy(): void {
    this.provider?.destroy();
    this.provider = null;
    this.currentChainId = null;
  }

  /**
   * Verify a contract exists at the given address on L1.
   */
  public async validateContractExistence(
    address: string,
    chainId: number,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.provider || this.currentChainId !== chainId) {
        this.setProviderForChainId(chainId);
      }
      const code = await withTimeout(
        this.provider!.getCode(address),
        L1_RPC_TIMEOUT,
        `eth_getCode on chain ${chainId}`,
      );

      if (code === '0x' || code === '0x0') {
        return {
          valid: false,
          error: `No contract deployed at address ${address} on chain ${chainId}`,
        };
      }
      return { valid: true };
    } catch (err: any) {
      if (err.message?.startsWith('timeout:')) {
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
      case 'tokamak-private-app-channel':
      case 'py-ethclient':
        // No specific ownership verification until identity contracts are defined
        return { valid: true };
      default:
        return { valid: false, error: `Unknown stack type: ${metadata.stackType}` };
    }
  }

  /**
   * tokamak-appchain: Timelock.hasRole(SECURITY_COUNCIL, signer) must be true
   */
  private async validateTokamakAppchainOwnership(
    metadata: TokamakAppchainMetadata,
  ): Promise<{ valid: boolean; error?: string; onChainOwner?: string }> {
    const timelockAddress = metadata.l1Contracts['Timelock'];
    if (!timelockAddress) {
      return { valid: false, error: 'Missing l1Contracts.Timelock' };
    }

    try {
      const timelock = new ethers.Contract(timelockAddress, TIMELOCK_ABI, this.provider!);
      const signer = metadata.metadata.signedBy;

      const hasRole: boolean = await withTimeout(
        timelock.hasRole(SECURITY_COUNCIL_ROLE, signer),
        L1_RPC_TIMEOUT,
        'Timelock.hasRole(SECURITY_COUNCIL)',
      );

      if (!hasRole) {
        // Try to get the actual SECURITY_COUNCIL member for error message
        let actualOwner = 'unknown';
        try {
          const count = await withTimeout(
            timelock.getRoleMemberCount(SECURITY_COUNCIL_ROLE),
            L1_RPC_TIMEOUT,
            'Timelock.getRoleMemberCount(SECURITY_COUNCIL)',
          );
          if (count > 0n) {
            actualOwner = await withTimeout(
              timelock.getRoleMember(SECURITY_COUNCIL_ROLE, 0),
              L1_RPC_TIMEOUT,
              'Timelock.getRoleMember(SECURITY_COUNCIL, 0)',
            );
          }
        } catch { /* ignore */ }

        return {
          valid: false,
          error: `Signer ${signer} does not have SECURITY_COUNCIL role on Timelock. On-chain SECURITY_COUNCIL: ${actualOwner}`,
          onChainOwner: actualOwner,
        };
      }

      return { valid: true, onChainOwner: signer };
    } catch (err: any) {
      if (err.message?.startsWith('timeout:')) {
        return {
          valid: false,
          error: `L1 RPC call timed out while checking Timelock.hasRole(SECURITY_COUNCIL)`,
        };
      }
      return {
        valid: false,
        error: `Failed to call hasRole() on Timelock: ${err.message}`,
      };
    }
  }

  /**
   * Validate L2 chain ID by calling eth_chainId on the provided RPC URL.
   */
  public async validateL2ChainId(
    metadata: TokamakAppchainMetadata,
  ): Promise<{ valid: boolean; error?: string }> {
    let l2Provider: ethers.JsonRpcProvider | null = null;
    try {
      l2Provider = new ethers.JsonRpcProvider(metadata.rpcUrl);
      const network = await withTimeout(
        l2Provider.getNetwork(),
        L2_RPC_TIMEOUT,
        `L2 RPC at ${metadata.rpcUrl}`,
      );

      const actualChainId = Number(network.chainId);
      if (actualChainId !== metadata.l2ChainId) {
        return {
          valid: false,
          error: `L2 chain ID mismatch: metadata says ${metadata.l2ChainId}, RPC reports ${actualChainId}`,
        };
      }

      return { valid: true };
    } catch (err: any) {
      if (err.message?.startsWith('timeout:')) {
        return {
          valid: false,
          error: `L2 RPC at ${metadata.rpcUrl} is unreachable (timeout ${L2_RPC_TIMEOUT / 1000}s)`,
        };
      }
      return {
        valid: false,
        error: `L2 RPC error at ${metadata.rpcUrl}: ${err.message}`,
      };
    } finally {
      l2Provider?.destroy();
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

    // 1. Check identity contract exists
    const identityField = getIdentityContractField(metadata.stackType);
    const identityAddress = metadata.l1Contracts[identityField];
    if (!identityAddress) {
      errors.push(`Missing identity contract: l1Contracts.${identityField}`);
      return { valid: false, errors };
    }

    // 2. Run all three checks in parallel (they use independent RPC calls)
    const [existenceResult, ownershipResult, l2ChainIdResult] = await Promise.all([
      this.validateContractExistence(identityAddress, metadata.l1ChainId),
      this.validateOwnership(metadata),
      this.validateL2ChainId(metadata),
    ]);

    if (!existenceResult.valid) {
      errors.push(existenceResult.error!);
    }
    if (!ownershipResult.valid) {
      errors.push(ownershipResult.error!);
    }
    if (!l2ChainIdResult.valid) {
      errors.push(l2ChainIdResult.error!);
    }

    this.destroy();

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const appchainContractValidator = new AppchainContractValidator();
