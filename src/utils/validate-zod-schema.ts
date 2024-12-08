import { type Result, err, ok } from "neverthrow";
import type { z } from "zod";

export const validateZodSchema = <T>(data: unknown, schema: z.Schema<T>, errorContext?: string): Result<T, Error> => {
	const parsed = schema.safeParse(data);

	if (!parsed.success) {
		const zodErrorMessage = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" | ");
		return err(new Error(`Validation failed${errorContext ? ` for ${errorContext}` : ""}: ${zodErrorMessage}`));
	}

	return ok(parsed.data);
};
