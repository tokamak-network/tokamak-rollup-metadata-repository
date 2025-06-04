import { AgendaMetadataSchema } from "../types/agenda-metadata.js";
import { ethers, verifyMessage, TransactionResponse, TransactionReceipt, Log } from "ethers";

// 상수 정의
const AGENDA_CREATED_EVENT = "event AgendaCreated(address indexed from,uint256 indexed id,address[] targets,uint128 noticePeriodSeconds,uint128 votingPeriodSeconds,bool atomicExecute)";
const SIGNATURE_MESSAGE_TEMPLATE = "I am the one who submitted agenda #%d via transaction %s. This signature proves that I am the one who submitted this agenda.";

const abiAgendaCreate = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address[]",
        "name": "targets",
        "type": "address[]"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "noticePeriodSeconds",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "votingPeriodSeconds",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "atomicExecute",
        "type": "bool"
      }
    ],
    "name": "AgendaCreated",
    "type": "event"
  }
]

// 이벤트 인터페이스 생성
export const iface = new ethers.Interface(abiAgendaCreate);

// 이벤트 타입 정의
interface AgendaCreatedEvent {
  from: string;
  id: bigint;
  targets: string[];
  noticePeriodSeconds: bigint;
  votingPeriodSeconds: bigint;
  atomicExecute: boolean;
}

// 에러 메시지
const ERROR_MESSAGES = {
  TRANSACTION_NOT_FOUND: (hash?: string) => `Transaction not found${hash ? `: ${hash}` : ''}`,
  RECEIPT_NOT_FOUND: (hash?: string) => `Transaction receipt not found${hash ? `: ${hash}` : ''}`,
  EVENT_NOT_FOUND: (hash?: string) => `AgendaCreated event not found in transaction logs${hash ? `: ${hash}` : ''}`,
  EVENT_DEFINITION_NOT_FOUND: "AgendaCreated event definition not found",
  EVENT_PARSE_FAILED: (hash?: string, error?: string) =>
    `Failed to parse AgendaCreated event log${hash ? `: ${hash}` : ''}${error ? `. Error: ${error}` : ''}`,
  SIGNATURE_MISMATCH: (recovered: string, expected: string) =>
    `Signature does not match expected address. Recovered: ${recovered}, Expected: ${expected}`,
  SENDER_MISMATCH: (actual: string, expected: string) =>
    `Transaction sender does not match expected address. Actual: ${actual}, Expected: ${expected}`,
  ID_MISMATCH: (actual: string, expected: string) =>
    `Agenda ID from event does not match expected ID. Actual: ${actual}, Expected: ${expected}`,
  INVALID_EVENT_DATA: (field: string, value: unknown) =>
    `Invalid event data: ${field} = ${JSON.stringify(value)}`
} as const;

export const AgendaValidator = {
  validateSchema(data: unknown) {
    return AgendaMetadataSchema.safeParse(data);
  },

  getAgendaSignatureMessage(agendaId: number, transactionHash: string): string {
    return SIGNATURE_MESSAGE_TEMPLATE.replace("%d", agendaId.toString()).replace("%s", transactionHash);
  },

  async validateAgendaSignature(
    agendaId: number,
    transactionHash: string,
    signature: string,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      const message = this.getAgendaSignatureMessage(agendaId, transactionHash);
      const recovered = verifyMessage(message, signature);
      const isValid = recovered.toLowerCase() === expectedAddress.toLowerCase();

      if (!isValid) {
        console.error(ERROR_MESSAGES.SIGNATURE_MISMATCH(
          recovered.toLowerCase(),
          expectedAddress.toLowerCase()
        ));
      }

      return isValid;
    } catch (error) {
      console.error("Signature validation error:", error instanceof Error ? error.message : error);
      return false;
    }
  },

  validateTransactionSender(tx: TransactionResponse, expectedSender: string): boolean {
    if (!tx) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND());
    }

    const isValid = tx.from.toLowerCase() === expectedSender.toLowerCase();
    if (!isValid) {
      console.error(ERROR_MESSAGES.SENDER_MISMATCH(
        tx.from.toLowerCase(),
        expectedSender.toLowerCase()
      ));
    }

    return isValid;
  },

  validateAgendaIdFromEvent(receipt: TransactionReceipt, expectedId: number): boolean {
    if (!receipt) {
      throw new Error(ERROR_MESSAGES.RECEIPT_NOT_FOUND());
    }

    const event = iface.getEvent("AgendaCreated");
    if (!event) {
      throw new Error(ERROR_MESSAGES.EVENT_DEFINITION_NOT_FOUND);
    }

    const eventTopic = event.topicHash;

    const log = receipt.logs.find(l => l.topics[0] === eventTopic);
    if (!log) {
      throw new Error(ERROR_MESSAGES.EVENT_NOT_FOUND(receipt.hash));
    }

    try {
      const parsed = iface.parseLog(log);

      if (!parsed) {
        throw new Error("Failed to parse event log");
      }

      const eventData = parsed.args as unknown as AgendaCreatedEvent;

      // 이벤트 데이터 유효성 검사
      if (!eventData.from || typeof eventData.from !== 'string') {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_DATA('from', eventData.from));
      }
      if (!eventData.id || typeof eventData.id !== 'bigint') {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_DATA('id', eventData.id));
      }
      if (!Array.isArray(eventData.targets)) {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_DATA('targets', eventData.targets));
      }
      if (!eventData.noticePeriodSeconds || typeof eventData.noticePeriodSeconds !== 'bigint') {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_DATA('noticePeriodSeconds', eventData.noticePeriodSeconds));
      }
      if (!eventData.votingPeriodSeconds || typeof eventData.votingPeriodSeconds !== 'bigint') {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_DATA('votingPeriodSeconds', eventData.votingPeriodSeconds));
      }
      if (typeof eventData.atomicExecute !== 'boolean') {
        throw new Error(ERROR_MESSAGES.INVALID_EVENT_DATA('atomicExecute', eventData.atomicExecute));
      }

      const eventId = eventData.id.toString();
      // console.log('eventId', eventId)
      // console.log('expectedId.toString()', expectedId.toString())

      const isValid = eventId === expectedId.toString();
      // console.log('isValid', isValid)


      if (!isValid) {
        console.error(ERROR_MESSAGES.ID_MISMATCH(
          eventId,
          expectedId.toString()
        ));
      }
      return isValid;
    } catch (error) {
      throw new Error(ERROR_MESSAGES.EVENT_PARSE_FAILED(
        receipt.hash,
        error instanceof Error ? error.message : String(error)
      ));
    }
  }
};
