import { z } from "zod";
import { solanaBase58AddressSchema } from "./solana";

export const heliusRpcResponseSchema = <T extends z.ZodTypeAny>(resultSchema: T) => {
	return z.object({
		jsonrpc: z.literal("2.0"),
		id: z.number().or(z.string()),
		result: resultSchema,
	});
};

//* DAS getAsset
const metadataSchema = z.object({
	description: z.string().nullish(),
	name: z.string().min(1),
	symbol: z.string().min(1),
});

const linkSchema = z.object({
	image: z.string().min(1).nullish(),
});

const contentSchema = z.object({
	json_uri: z.string().url().nullish(),
	metadata: metadataSchema,
	links: linkSchema.nullish(),
});

const tokenInfoSchema = z.object({
	balance: z.number().min(0).nullish(),
	supply: z.number().min(0),
	decimals: z.number().min(0),
	freeze_authority: solanaBase58AddressSchema.nullish(),
	mint_authority: solanaBase58AddressSchema.nullish(),
});

export const dasAssetSchema = z.object({
	id: solanaBase58AddressSchema,
	content: contentSchema,
	mutable: z.boolean(),
	token_info: tokenInfoSchema,
});

export const dasAssetResponseSchema = heliusRpcResponseSchema(dasAssetSchema);
export type DasAsset = z.infer<typeof dasAssetSchema>;
