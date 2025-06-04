import { z } from "zod";

// 이더리움 주소 검증 (0x + 40자리 16진수)
const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
const ethereumAddressSchema = z.string().regex(ethereumAddressRegex, "Invalid Ethereum address format");

// 16진수 문자열 검증 (0x로 시작하는 16진수)
const hexStringSchema = z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid hex string format");

// 함수 시그니처 검증 (예: "transfer(address,uint256)")
const functionSignatureRegex = /^[a-zA-Z0-9_]+\([a-zA-Z0-9_,\s]*\)$/;
const functionSignatureSchema = z.string().regex(functionSignatureRegex, "Invalid function signature format");

const AbiItemSchema = z.object({
  inputs: z.array(z.object({
    internalType: z.string(),
    name: z.string(),
    type: z.string()
  })),
  name: z.string(),
  outputs: z.array(z.object({
    internalType: z.string(),
    name: z.string(),
    type: z.string()
  })),
  stateMutability: z.string(),
  type: z.string()
});

const ActionSchema = z.object({
  title: z.string().min(1).max(100),
  contractAddress: ethereumAddressSchema,
  method: functionSignatureSchema,
  calldata: hexStringSchema,
  abi: z.array(AbiItemSchema),
  sendEth: z.boolean(),
  id: z.string().min(1),
  type: z.string().min(1)
});

export const AgendaMetadataSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(50000),
  network: z.enum(["mainnet", "sepolia"]),
  transaction: hexStringSchema,
  creator: z.object({
    address: ethereumAddressSchema,
    signature: hexStringSchema
  }),
  actions: z.array(ActionSchema).min(1)
});

export type AgendaMetadata = z.infer<typeof AgendaMetadataSchema>;
export type AbiItem = z.infer<typeof AbiItemSchema>;
export type Action = z.infer<typeof ActionSchema>;
