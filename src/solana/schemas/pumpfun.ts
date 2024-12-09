import { z } from "zod";
import { solanaBase58AddressSchema } from "./solana";

export const tokenDetailsSchema = z.object({
	mint: solanaBase58AddressSchema,
	virtual_sol_reserves: z.number().min(0),
	virtual_token_reserves: z.number().min(0),
	total_supply: z.number().min(0),
	inverted: z.literal(true).nullish(),
	king_of_the_hill_timestamp: z.number().min(0).nullish(),
	market_cap: z.number().min(0),
	usd_market_cap: z.number().min(0),
});

export type TokenDetails = z.infer<typeof tokenDetailsSchema>;
