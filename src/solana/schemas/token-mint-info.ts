import { z } from "zod";
import { solanaBase58AddressSchema } from "./solana";

const tokenMintSourceSchema = z.enum(["MOONSHOT", "PUMPFUN", "DEFAULT"]);

export const tokenMintInfoSchema = z.object({
	mintSource: tokenMintSourceSchema,
	mintedAt: z.number().min(0),
	devAddress: solanaBase58AddressSchema,
	bondingCurveAddress: solanaBase58AddressSchema.nullable(),
});

export type TokenMintSource = z.infer<typeof tokenMintSourceSchema>;
export type TokenMintInfo = z.infer<typeof tokenMintInfoSchema>;
