import { ResultAsync, errAsync, okAsync } from "neverthrow";
import type { z } from "zod";

export const handleEnhancedResponse = <T>(
	response: Response,
	schema: z.Schema<T>,
	context?: string,
): ResultAsync<T, Error> => {
	return ResultAsync.fromPromise(
		response.json(),
		() => new Error(`Failed to parse JSON response${context ? ` for ${context}` : ""}`),
	).andThen((data) => {
		const parsed = schema.safeParse(data);

		if (!parsed.success) {
			const zodErrorMessage = parsed.error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join(" | ");
			return errAsync(new Error(`Validation failed${context ? ` for ${context}` : ""}: ${zodErrorMessage}`));
		}

		return okAsync(parsed.data);
	});
};
