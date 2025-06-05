import { ethers } from 'ethers';

/**
 * Address validation module
 */
export class AddressValidator {
  /**
   * Ethereum address format validation
   */
  public isValidAddress(address: string): boolean {
    try {
      // 1. 기본 형식 체크 (0x 또는 0X로 시작하고 40자리 hex)
      if (!/^0[xX][a-fA-F0-9]{40}$/.test(address)) {
        return false;
      }

      // 2. 0X를 0x로 정규화
      const normalizedAddress = address.startsWith('0x') ? address : '0x' + address.slice(2);

      // 3. ethers.js로 기본 유효성 검증
      if (!ethers.isAddress(normalizedAddress)) {
        return false;
      }

      // 4. 체크섬 검증 (mixed case인 경우만)
      const hexPart = address.slice(2);
      const hasUpperCase = /[A-F]/.test(hexPart);
      const hasLowerCase = /[a-f]/.test(hexPart);

      // Mixed case라면 체크섬이 정확해야 함
      if (hasUpperCase && hasLowerCase) {
        try {
          const checksumAddress = ethers.getAddress(normalizedAddress);
          return checksumAddress === normalizedAddress;
        } catch {
          return false; // 체크섬이 틀림
        }
      }

      // 모두 소문자 또는 모두 대문자면 허용 (체크섬 없음)
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate filename matches SystemConfig address
   */
  public validateFilename(filename: string, systemConfigAddress: string): boolean {
    const expectedFilename = `${systemConfigAddress.toLowerCase()}.json`;
    return filename === expectedFilename;
  }

  /**
   * Validate contract addresses in metadata
   */
  public validateContractAddresses(
    l1Contracts: Record<string, string | undefined>,
    l2Contracts: Record<string, string | undefined>,
    sequencerAddress: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate L1 contract addresses
    Object.entries(l1Contracts).forEach(([name, address]) => {
      if (address && !this.isValidAddress(address)) {
        errors.push(`Invalid L1 contract address for ${name}: ${address}`);
      }
    });

    // Validate L2 contract addresses
    Object.entries(l2Contracts).forEach(([name, address]) => {
      if (address && !this.isValidAddress(address)) {
        errors.push(`Invalid L2 contract address for ${name}: ${address}`);
      }
    });

    // Validate sequencer address
    if (!this.isValidAddress(sequencerAddress)) {
      errors.push(`Invalid sequencer address: ${sequencerAddress}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const addressValidator = new AddressValidator();