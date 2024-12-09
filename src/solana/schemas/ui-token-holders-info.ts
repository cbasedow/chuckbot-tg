import { z } from "zod";
import { bigNumberSchema } from "./bignumber";
import { solanaBase58AddressSchema } from "./solana";

export const tokenHolderSchema = z.object({
	address: solanaBase58AddressSchema,
	holderPercentBn: bigNumberSchema,
});

export const uiTokenHolderSchema = z.object({
	address: solanaBase58AddressSchema,
	uiHolderPercent: z.string().min(1),
	solscanUrl: z.string().min(1),
});

export const uiTokenHoldersInfoSchema = z.object({
	uiT10HoldersPercent: z.string().min(1),
	uiDevHolderPercent: z.string().min(1),
	uiT5Holders: uiTokenHolderSchema.array().max(5), // We will display the top 5 holders in Telegram UI
});

export type TokenHolder = z.infer<typeof tokenHolderSchema>;
export type UITokenHolder = z.infer<typeof uiTokenHolderSchema>;
export type UITokenHoldersInfo = z.infer<typeof uiTokenHoldersInfoSchema>;
