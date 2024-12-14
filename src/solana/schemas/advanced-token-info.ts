import { z } from "zod";
import { allTimeHighPriceInfoSchema } from "./all-time-high-price-info";
import { fullTokenMetadataSchema, socialUrlSchema } from "./full-token-metadata";
import { solanaBase58AddressSchema } from "./solana";
import { tokenMetricsSchema } from "./token-metrics";
import { tokenMintInfoSchema, tokenMintSourceSchema } from "./token-mint-info";
import { uiTokenHoldersInfoSchema } from "./ui-token-holders-info";

export const advancedTokenInfoSchema = z.object({
	fullMetadata: fullTokenMetadataSchema,
	mintInfo: tokenMintInfoSchema,
	uiHoldersInfo: uiTokenHoldersInfoSchema,
	allTimeHighPriceInfo: allTimeHighPriceInfoSchema.nullable(),
	metrics: tokenMetricsSchema,
});

export const uiAdvancedTokenInfoSchema = z.object({
	name: z.string().min(1),
	address: solanaBase58AddressSchema,
	symbol: z.string().min(1),
	logoUrl: z.string().url().nullable(),
	source: tokenMintSourceSchema,
	relativeAgeString: z.string().min(1),
	migratedRelativeAgeString: z.string().min(1).nullable(),
	poolName: z.string().min(1),
	isFreezable: z.boolean(),
	isMintable: z.boolean(),
	isMutable: z.boolean(),
	socialUrls: socialUrlSchema.array(),
	uiPriceUsd: z.string().min(1),
	uiPriceChange1hPercent: z.string().min(1).nullable(),
	uiMcapUsd: z.string().min(1),
	uiAllTimeHigh: z
		.object({
			uiMcapUsd: z.string().min(1),
			relativeAgeString: z.string().min(1),
		})
		.nullable(),
	uiLiquidityUsd: z.string().min(1).nullable(),
	uiVolume1h: z
		.object({
			uiUsd: z.string().min(1),
			totalBuys: z.number().min(0),
			totalSells: z.number().min(0),
		})
		.nullable(),
	uiHoldersInfo: uiTokenHoldersInfoSchema,
	devAddress: solanaBase58AddressSchema,
});

export type AdvancedTokenInfo = z.infer<typeof advancedTokenInfoSchema>;
export type UIAdvancedTokenInfo = z.infer<typeof uiAdvancedTokenInfoSchema>;
