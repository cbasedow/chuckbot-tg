import { z } from "zod";
import { solanaBase58AddressSchema } from "./solana";

export const tokenHolderSchema = z.object({
	address: solanaBase58AddressSchema,
	holderPercent: z.number().min(0).max(100),
});

export const uiTokenHolderSchema = tokenHolderSchema.extend({
	solscanUrl: z.string().url(),
});

export const tokenHoldersInfoSchema = z.object({
	t10HoldersPercent: z.number().min(0).max(100),
	devHolderPercent: z.number().min(0).max(100),
	uiT5Holders: uiTokenHolderSchema.array().max(5), // We will display the top 5 holders in Telegram UI
});

export type TokenHolder = z.infer<typeof tokenHolderSchema>;
export type UITokenHolder = z.infer<typeof uiTokenHolderSchema>;
export type TokenHoldersInfo = z.infer<typeof tokenHoldersInfoSchema>;
