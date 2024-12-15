import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { eq, sql } from "drizzle-orm";
import { ResultAsync, errAsync } from "neverthrow";
import { z } from "zod";
import { db } from "..";
import { users } from "../schema";

const userIdSchema = z.number().positive();

export const updateUserTokenScanCount = (userId: number): ResultAsync<void, Error> => {
	const parsedInputResult = validateZodSchema(userId, userIdSchema, "userId");
	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const validatedUserId = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db
			.update(users)
			.set({ tokenScanCount: sql`${users.tokenScanCount} + 1` })
			.where(eq(users.id, validatedUserId))
			.then(() => void 0),
		ensureError,
	);
};
