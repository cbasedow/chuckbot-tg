import { z } from "zod";
import { allTimeHighPriceInfoSchema } from "./all-time-high-price-info";
import { fullTokenMetadataSchema } from "./full-token-metadata";
import { tokenMetricsSchema } from "./token-metrics";
import { tokenMintInfoSchema } from "./token-mint-info";
import { uiTokenHoldersInfoSchema } from "./ui-token-holders-info";

export const advancedTokenInfoSchema = z.object({
	fullMetadata: fullTokenMetadataSchema,
	mintInfo: tokenMintInfoSchema,
	uiHoldersInfo: uiTokenHoldersInfoSchema,
	allTimeHighPriceInfo: allTimeHighPriceInfoSchema.nullable(),
	metrics: tokenMetricsSchema,
});

export type AdvancedTokenInfo = z.infer<typeof advancedTokenInfoSchema>;
