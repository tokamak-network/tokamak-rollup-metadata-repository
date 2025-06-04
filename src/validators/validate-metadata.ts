import fs from "fs";
import path from "path";
import { JsonRpcProvider, TransactionResponse, TransactionReceipt } from "ethers";
import { AgendaValidator } from "./agenda-validator.js";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { parseArgs } from "node:util";
import { ethers } from "ethers";

// 환경 변수 로드 (로컬 개발 환경용)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// 상수 정의
const NETWORKS = ["mainnet", "sepolia"] as const;
const AGENDA_FILE_PATTERN = /^agenda-(\d+)\.json$/;
const AGENDA_PATH_PATTERN = /^data\/agendas\/(mainnet|sepolia)\//;
const PR_TITLE_PATTERN = /^\[Agenda\]\s+(mainnet|sepolia)\s*-\s*(\d+)\s*-\s*(.+)$/;
const ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const TRANSACTION_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const SIGNATURE_PATTERN = /^0x[a-fA-F0-9]{130}$/;

// 타입 정의
type Network = typeof NETWORKS[number];

interface PrTitleInfo {
  network: Network;
  id: number;
  title: string;
}

interface AbiItem {
  inputs: Array<{
    internalType: string;
    name: string;
    type: string;
  }>;
  name: string;
  outputs: Array<{
    internalType: string;
    name: string;
    type: string;
  }>;
  stateMutability: string;
  type: string;
}

interface AgendaMetadata {
  id: number;
  title: string;
  description: string;
  network: Network;
  transaction: string;
  creator: {
    address: string;
    signature: string;
  };
  actions: Array<{
    title: string;
    contractAddress: string;
    method: string;
    calldata: string;
    abi: AbiItem[];
    sendEth: boolean;
    id: string;
    type: string;
  }>;
}

// 주소 정규화 함수
function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function parsePrTitle(title: string): PrTitleInfo | null {
  const match = title.match(PR_TITLE_PATTERN);
  if (!match) return null;
  return {
    network: match[1] as Network,
    id: Number(match[2]),
    title: match[3].trim(),
  };
}

function getRpcUrl(network: Network): string {
  const rpcUrl = network === "mainnet" ? process.env.MAINNET_RPC_URL : process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error(`Missing RPC URL for network: ${network}. Please check your .env file.`);
  }
  return rpcUrl;
}

async function validateFile(filePath: string, prTitle?: string): Promise<boolean> {
  try {
    if (!prTitle) {
      throw new Error("PR title is required");
    }

    const parsedPrTitle = parsePrTitle(prTitle);
    if (!parsedPrTitle) {
      throw new Error(`PR title must be in the form [Agenda] <network> - <id> - <title>`);
    }

    // 파일 경로에서 network 추출
    const match = filePath.match(AGENDA_PATH_PATTERN);
    const pathNetwork = match ? match[1] as Network : null;

    if (!pathNetwork || !NETWORKS.includes(pathNetwork)) {
      throw new Error(`Invalid network in file path: ${pathNetwork}. Must be one of: ${NETWORKS.join(", ")}`);
    }

    // 파일명에서 id 추출
    const fileName = path.basename(filePath);
    const fileNameMatch = fileName.match(AGENDA_FILE_PATTERN);
    const fileId = fileNameMatch ? Number(fileNameMatch[1]) : null;

    if (!fileId) {
      throw new Error(`File name must be in the form agenda-<id>.json (got: ${fileName})`);
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as AgendaMetadata;

    // 필수 필드 검증
    if (!data.transaction) {
      throw new Error("Transaction hash is required");
    }
    if (!data.creator) {
      throw new Error("Creator information is required");
    }
    if (!data.creator.address) {
      throw new Error("Creator address is required");
    }
    if (!data.creator.signature) {
      throw new Error("Creator signature is required");
    }
    if (!Array.isArray(data.actions) || data.actions.length === 0) {
      throw new Error("At least one action is required");
    }

    // 주소 형식 검증
    if (!data.creator.address.match(ETH_ADDRESS_PATTERN)) {
      throw new Error(`Invalid creator address format: ${data.creator.address}`);
    }

    // 서명 형식 검증
    if (!data.creator.signature.match(SIGNATURE_PATTERN)) {
      throw new Error(`Invalid signature format: ${data.creator.signature}`);
    }

    // 트랜잭션 해시 형식 검증
    if (!data.transaction.match(TRANSACTION_HASH_PATTERN)) {
      throw new Error(`Invalid transaction hash format: ${data.transaction}`);
    }

    // actions 배열 검증
    for (const [index, action] of data.actions.entries()) {
      if (!action.contractAddress.match(ETH_ADDRESS_PATTERN)) {
        throw new Error(`Invalid contract address format in action ${index}: ${action.contractAddress}`);
      }
      if (!action.method) {
        throw new Error(`Method is required in action ${index}`);
      }
      if (!action.calldata) {
        throw new Error(`Calldata is required in action ${index}`);
      }
      if (!Array.isArray(action.abi)) {
        throw new Error(`ABI must be an array in action ${index}`);
      }
    }

    // 파일명과 id 일치 검증
    if (fileId !== data.id) {
      throw new Error(`File name id (${fileId}) does not match metadata id (${data.id})`);
    }

    // PR 제목과 메타데이터 값 비교
    if (parsedPrTitle.network !== data.network) {
      throw new Error(`PR title network (${parsedPrTitle.network}) does not match metadata network (${data.network})`);
    }
    if (parsedPrTitle.id !== data.id) {
      throw new Error(`PR title id (${parsedPrTitle.id}) does not match metadata id (${data.id})`);
    }
    if (parsedPrTitle.title !== data.title) {
      throw new Error(`PR title title (${parsedPrTitle.title}) does not match metadata title (${data.title})`);
    }

    // 파일 경로와 network 값 비교
    if (pathNetwork !== data.network) {
      throw new Error(`File path network (${pathNetwork}) does not match metadata network (${data.network})`);
    }

    // 네트워크 값 검증
    if (!NETWORKS.includes(data.network)) {
      throw new Error(`Invalid network in metadata: ${data.network}. Must be one of: ${NETWORKS.join(", ")}`);
    }

    const result = AgendaValidator.validateSchema(data);
    if (!result.success) {
      throw new Error(`Schema validation failed: ${JSON.stringify(result.error.issues, null, 2)}`);
    }

    // 트랜잭션 검증
    const provider = new JsonRpcProvider(getRpcUrl(data.network));
    let retryCount = 0;
    const maxRetries = 3;

    // 트랜잭션 조회 및 이벤트 검증 (재시도 로직 포함)
    let tx: TransactionResponse | null = null;
    let receipt: TransactionReceipt | null = null;

    while (retryCount < maxRetries) {
      try {
        tx = await provider.getTransaction(data.transaction);
        if (!tx) throw new Error(`Transaction not found: ${data.transaction}`);

        receipt = await provider.getTransactionReceipt(data.transaction);
        if (!receipt) throw new Error(`Transaction receipt not found: ${data.transaction}`);

        // 트랜잭션 상태 검증
        if (receipt.status === 0) {
          throw new Error(`Transaction failed: ${data.transaction}`);
        }

        break;
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!tx || !receipt) {
      throw new Error(`Failed to get transaction data after ${maxRetries} retries`);
    }

    const normalizedCreatorAddress = normalizeAddress(data.creator.address);
    const normalizedTxFrom = normalizeAddress(tx.from);

    const txCheck = AgendaValidator.validateTransactionSender(tx, data.creator.address);
    if (!txCheck) {
      throw new Error(
        `Transaction sender does not match creator address.\n` +
        `Expected: ${normalizedCreatorAddress}\n` +
        `Got: ${normalizedTxFrom}`
      );
    }

    const idCheck = AgendaValidator.validateAgendaIdFromEvent(receipt, data.id);
    if (!idCheck) {
      throw new Error(`AgendaCreated event id does not match metadata id (${data.id})`);
    }

    // 서명 검증 (재시도 없음)
    const sigCheck = await AgendaValidator.validateAgendaSignature(
      data.id,
      data.transaction,
      data.creator.signature,
      data.creator.address
    );
    if (!sigCheck) {
      const message = AgendaValidator.getAgendaSignatureMessage(data.id, data.transaction);
      const recovered = ethers.verifyMessage(message, data.creator.signature);
      throw new Error(
        `Creator signature is invalid or does not match creator address.\n` +
        `Expected: ${normalizedCreatorAddress}\n` +
        `Recovered: ${normalizeAddress(recovered)}\n` +
        `Message: ${message}`
      );
    }

    console.log(`✅ ${filePath} is valid.`);
    return true;
  } catch (error) {
    console.error(`❌ ${filePath} error:`, error instanceof Error ? error.message : error);
    return false;
  }
}

// 메인 로직
(async () => {
  const args = process.argv.slice(2);
  const files: string[] = [];
  let prTitleArg: string | undefined;

  // 명령행 인자 파싱
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pr-title" && i + 1 < args.length) {
      prTitleArg = args[i + 1];
      i++;
    } else {
      files.push(args[i]);
    }
  }

  if (files.length === 0) {
    console.error("Usage: ts-node src/validators/validate-metadata.ts [--pr-title '<PR_TITLE>'] <file1.json> [file2.json ...]");
    process.exit(1);
  }

  if (files.length > 1) {
    console.error("❌ Only one metadata file is allowed per PR.");
    process.exit(1);
  }

  const prTitle = prTitleArg || process.env.PR_TITLE;
  const results = await Promise.all(files.map(file => validateFile(file, prTitle)));

  if (results.some(result => !result)) {
    process.exit(2);
  }
  process.exit(0);
})();

export async function validateMetadata(
  metadata: AgendaMetadata,
  agendaId: number,
  transactionHash: string,
  signature: string,
  expectedAddress: string
): Promise<boolean> {
  try {
    // 1. Validate schema
    const schemaResult = AgendaValidator.validateSchema(metadata);
    if (!schemaResult.success) {
      throw new Error(`Schema validation failed: ${JSON.stringify(schemaResult.error.issues, null, 2)}`);
    }

    // 2. Validate signature
    const signatureValid = await AgendaValidator.validateAgendaSignature(
      agendaId,
      transactionHash,
      signature,
      expectedAddress
    );
    if (!signatureValid) {
      throw new Error(`Invalid signature for address: ${expectedAddress}`);
    }

    // 3. Validate transaction
    const rpcUrl = metadata.network === "mainnet"
      ? process.env.MAINNET_RPC_URL
      : process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) throw new Error(`Missing RPC URL for network: ${metadata.network}`);
    const provider = new JsonRpcProvider(rpcUrl);

    const tx = await provider.getTransaction(transactionHash);
    if (!tx) {
      throw new Error(`Transaction not found: ${transactionHash}`);
    }

    const senderValid = AgendaValidator.validateTransactionSender(tx, expectedAddress);
    if (!senderValid) {
      throw new Error(`Transaction sender (${tx.from}) does not match expected address (${expectedAddress})`);
    }

    // 4. Validate agenda ID from event
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt) {
      throw new Error(`Transaction receipt not found: ${transactionHash}`);
    }

    const agendaIdValid = AgendaValidator.validateAgendaIdFromEvent(receipt, agendaId);
    if (!agendaIdValid) {
      throw new Error(`Agenda ID from event does not match expected ID: ${agendaId}`);
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Metadata validation failed: ${error.message}`);
    }
    throw error;
  }
}
