import { z } from "zod";
import { bigNumberSchema } from "./bignumber";
import { solanaBase58AddressSchema } from "./solana";

export const defaultTokenMetricsSchema = z.object({
	poolName: z.string().min(1),
	baseTokenAddress: solanaBase58AddressSchema,
	priceSolBn: bigNumberSchema,
	priceUsdBn: bigNumberSchema,
	mcapUsdBn: bigNumberSchema,
	liquidityUsdBn: bigNumberSchema,
});

export const dexscreenerTokenMetricsSchema = defaultTokenMetricsSchema.extend({
	quoteTokenAddress: solanaBase58AddressSchema,
	poolName: z.union([z.string().min(1), z.literal("moonshot")]),
	poolAddress: solanaBase58AddressSchema,
	volume1hUsdBn: bigNumberSchema,
	totalBuys1h: z.number().min(0),
	totalSells1h: z.number().min(0),
	priceChange1hPercent: z.number().min(-100).max(100),
	liquidityUsdBn: bigNumberSchema.nullable(),
	bondingProgress: z.number().min(0).max(100).nullable(),
});

export const pumpfunTokenMetricsSchema = defaultTokenMetricsSchema.extend({
	poolName: z.literal("pumpfun"),
	reachedKothAt: z.number().min(0).nullable(),
	liquidityUsdBn: bigNumberSchema,
});

export const tokenMetricsSchema = z.union([dexscreenerTokenMetricsSchema, pumpfunTokenMetricsSchema]);

export type DexScreenerTokenMetrics = z.infer<typeof dexscreenerTokenMetricsSchema>;
export type PumpFunTokenMetrics = z.infer<typeof pumpfunTokenMetricsSchema>;
export type TokenMetrics = z.infer<typeof tokenMetricsSchema>;
