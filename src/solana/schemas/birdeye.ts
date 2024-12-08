import { z } from "zod";

export const birdeyeApiResponseSchema = <T extends z.ZodTypeAny>(responseSchema: T) => {
	return z.object({
		success: z.literal(true),
		data: responseSchema.nullish(),
	});
};

export const tokenCreationInfoSchema = z.object({
	txHash: z.string().min(1),
});

export const tokenCreationInfoResponseSchema = birdeyeApiResponseSchema(tokenCreationInfoSchema);

export type TokenCreationInfo = z.infer<typeof tokenCreationInfoSchema>;
