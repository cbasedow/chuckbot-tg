import { z } from "zod";

export const heliusRpcResponseSchema = <T extends z.ZodTypeAny>(resultSchema: T) => {
	return z.object({
		jsonrpc: z.literal("2.0"),
		id: z.number().or(z.string()),
		result: resultSchema,
	});
};
