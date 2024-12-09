import { z } from "zod";
import { SOLANA_BASE58_ADDRESS_REGEX } from "../constants";

export const solanaBase58AddressSchema = z.string().regex(SOLANA_BASE58_ADDRESS_REGEX);

//* Solana Parsed Token Account
export const tokenAmountSchema = z.object({
	amount: z.string().min(1), // Raw amount
	decimals: z.number().min(0),
	uiAmount: z.number().min(0).nullable(), // deprecated
	uiAmountString: z.string().min(1),
});

export const parsedTokenAccountInfoSchema = z.object({
	mint: solanaBase58AddressSchema,
	owner: solanaBase58AddressSchema,
	tokenAmount: tokenAmountSchema,
});

export const parsedTokenAccountSchema = z.object({
	info: parsedTokenAccountInfoSchema,
	type: z.literal("account"),
});

export const parsedTokenAccountDataSchema = z.object({
	parsed: parsedTokenAccountSchema,
});

export const parsedProgramTokenAccountSchema = z.object({
	data: parsedTokenAccountDataSchema,
});

export type ParsedTokenAccountInfo = z.infer<typeof parsedTokenAccountInfoSchema>;
