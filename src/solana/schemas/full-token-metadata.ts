import { z } from "zod";
import { bigNumberSchema } from "./bignumber";

export const socialUrlPlatformSchema = z.enum(["discord", "telegram", "twitter", "website"]);

export const socialUrlSchema = z.object({
	platform: socialUrlPlatformSchema,
	url: z.string().url(),
});

export const fullTokenMetadataSchema = z.object({
	name: z.string().min(1),
	symbol: z.string().min(1),
	circulatingSupplyBn: bigNumberSchema,
	logoUrl: z.string().url().nullable(),
	isFreezable: z.boolean(),
	isMintable: z.boolean(),
	isMutable: z.boolean(),
	socialUrls: socialUrlSchema.array(),
});

export type SocialUrlPlatform = z.infer<typeof socialUrlPlatformSchema>;
export type SocialUrl = z.infer<typeof socialUrlSchema>;
export type FullTokenMetadata = z.infer<typeof fullTokenMetadataSchema>;
