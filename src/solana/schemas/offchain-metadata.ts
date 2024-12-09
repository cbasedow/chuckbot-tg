import { z } from "zod";

const extensions = z.record(z.string().min(1));

const socials = z.object({
	url: z.string().min(1),
	type: z.string().min(1),
});

const websites = z.object({
	label: z.string().min(1),
	url: z.string().min(1),
});

export const offchainMetadataSchema = z.object({
	description: z.string().nullish(),
	telegram: z.string().min(1).nullish(),
	twitter: z.string().min(1).nullish(),
	website: z.string().min(1).nullish(),
	extensions: extensions.nullish(),
	socials: socials.array().nullish(),
	websites: websites.array().nullish(),
});

export type OffchainMetadata = z.infer<typeof offchainMetadataSchema>;
