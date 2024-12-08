import { z } from "zod";

export const birdeyeApiResponseSchema = <T extends z.ZodTypeAny>(responseSchema: T) => {
	return z.object({
		success: z.literal(true),
		data: responseSchema.nullish(),
	});
};
