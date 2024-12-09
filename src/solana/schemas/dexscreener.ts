import { z } from "zod";
import { solanaBase58AddressSchema } from "./solana";

const pairTokenSchema = z.object({
	address: solanaBase58AddressSchema,
	name: z.string().min(1),
	symbol: z.string().min(1),
});

const pairVolumeSchema = z.object({
	h24: z.number().min(0),
	h6: z.number().min(0),
	h1: z.number().min(0),
	m5: z.number().min(0),
});

const pairPriceChangeSchema = z.object({
	// Numbers can be negative
	m5: z.number(),
	h1: z.number(),
	h6: z.number(),
	h24: z.number(),
});

const pairLiquiditySchema = z.object({
	usd: z.number().min(0),
	base: z.number().min(0),
	quote: z.number().min(0),
});

const pairBuySellSchema = z.object({
	buys: z.number().min(0),
	sells: z.number().min(0),
});

const pairTxnsSchema = z.object({
	m5: pairBuySellSchema,
	h1: pairBuySellSchema,
	h6: pairBuySellSchema,
	h24: pairBuySellSchema,
});

const basePairSchema = z.object({
	chainId: z.literal("solana"),
	labels: z.string().min(1).array().nullish(),
	pairAddress: solanaBase58AddressSchema,
	baseToken: pairTokenSchema,
	quoteToken: pairTokenSchema,
	priceNative: z.string().min(1),
	priceUsd: z.string().min(1),
	txns: pairTxnsSchema,
	volume: pairVolumeSchema,
	priceChange: pairPriceChangeSchema,
	fdv: z.number().min(0),
	pairCreatedAt: z.number().min(0),
});

export const defaultPairSchema = basePairSchema.extend({
	dexId: z
		.string()
		.min(1)
		.refine((dexId) => dexId !== "moonshot", {
			message: "dexId cannot be 'moonshot' for default pairs",
		}),
	liquidity: pairLiquiditySchema,
});

export const moonshotPairSchema = basePairSchema.extend({
	dexId: z.literal("moonshot"),
	moonshot: z.object({
		progress: z.number().min(0).nullish(),
	}),
});

export const pairSchema = defaultPairSchema.or(moonshotPairSchema);

export const pairsResponseSchema = z.object({
	schemaVersion: z.string().min(1),
	pairs: pairSchema.array().nullish(),
});

export type MoonshotPair = z.infer<typeof moonshotPairSchema>;
export type DexScreenerPair = z.infer<typeof pairSchema>;
