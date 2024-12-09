import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { ResultAsync, errAsync } from "neverthrow";
import { db } from "..";
import { type DBUser, type NewDBUser, insertUserSchema, users } from "../schema";

export const upsertDBUser = (newDBUser: NewDBUser): ResultAsync<DBUser, Error> => {
	const parsedInputResult = validateZodSchema(newDBUser, insertUserSchema, "NewDBUser");

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const parsedInput = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db
			.insert(users)
			.values(parsedInput)
			.onConflictDoUpdate({
				target: users.id,
				set: { username: parsedInput.username },
			})
			.returning()
			.then(([user]) => user),
		ensureError,
	);
};
