/**
 * File Utilities
 * Common file operations for metadata validation
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface FileInfo {
  filepath: string;
  filename: string;
  network: string;
  exists: boolean;
}

/**
 * Extract network from file path
 */
export function extractNetworkFromPath(filepath: string): string | null {
  if (filepath.includes('/data/mainnet/')) {
    return 'mainnet';
  } else if (filepath.includes('/data/sepolia/')) {
    return 'sepolia';
  } else if (filepath.includes('/data/holesky/')) {
    return 'holesky';
  }
  return null;
}

/**
 * Check if a file path is an appchain-data path.
 */
export function isAppchainPath(filepath: string): boolean {
  return filepath.includes('tokamak-appchain-data/');
}

/**
 * Get file information including network detection.
 * Supports both legacy (data/{network}/) and appchain (tokamak-appchain-data/{chainId}/{stack}/) paths.
 */
export async function getFileInfo(filepath: string): Promise<FileInfo> {
  const absolutePath = path.isAbsolute(filepath)
    ? filepath
    : path.resolve(process.cwd(), filepath);

  const filename = path.basename(absolutePath);

  let network: string | null = null;

  if (isAppchainPath(absolutePath)) {
    // For appchain paths, derive a pseudo-network from the chain ID
    const chainIdMatch = absolutePath.match(/tokamak-appchain-data\/(\d+)\//);
    if (chainIdMatch) {
      const chainId = parseInt(chainIdMatch[1]);
      if (chainId === 1) network = 'mainnet';
      else if (chainId === 11155111) network = 'sepolia';
      else if (chainId === 17000) network = 'holesky';
      else network = `chain-${chainId}`;
    }
  } else {
    network = extractNetworkFromPath(absolutePath);
  }

  if (!network) {
    throw new Error(`Cannot determine network from file path: ${filepath}. File should be in data/{network}/ or tokamak-appchain-data/{chainId}/{stackType}/ directory`);
  }

  let exists = false;
  try {
    await fs.access(absolutePath);
    exists = true;
  } catch {
    exists = false;
  }

  return {
    filepath: absolutePath,
    filename,
    network,
    exists
  };
}

/**
 * Read and parse JSON metadata file
 */
export async function readMetadataFile(filepath: string): Promise<any> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      throw new Error(`File not found: ${filepath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format in ${filepath}: ${error.message}`);
    } else {
      throw new Error(`Failed to read file ${filepath}: ${(error as Error).message}`);
    }
  }
}

/**
 * Validate SystemConfig address format and filename match
 */
export function validateFilename(filename: string, systemConfigAddress: string): boolean {
  const expectedFilename = `${systemConfigAddress.toLowerCase()}.json`;
  return filename === expectedFilename;
}