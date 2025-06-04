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
 * Get file information including network detection
 */
export async function getFileInfo(filepath: string): Promise<FileInfo> {
  const absolutePath = path.isAbsolute(filepath)
    ? filepath
    : path.resolve(process.cwd(), filepath);

  const filename = path.basename(absolutePath);
  const network = extractNetworkFromPath(absolutePath);

  if (!network) {
    throw new Error(`Cannot determine network from file path: ${filepath}. File should be in data/mainnet/, data/sepolia/, or data/holesky/ directory`);
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