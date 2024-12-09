import { z } from "zod";
import { bigNumberSchema } from "./bignumber";

export const allTimeHighPriceInfoSchema = z.object({
	priceUsdBn: bigNumberSchema,
	reachedAt: z.number().min(0), // Unix timestamp in seconds
	lastQueryTimeTo: z.number().min(0), // The last timeTo value used to fetch OHLCV prices
});

export type AllTimeHighPriceInfo = z.infer<typeof allTimeHighPriceInfoSchema>;
