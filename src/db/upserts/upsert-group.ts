import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { ResultAsync, errAsync } from "neverthrow";
import { db } from "..";
import { type DBGroup, type NewDBGroup, groups, insertGroupSchema } from "../schema";

export const upsertDBGroup = (newDBGroup: NewDBGroup): ResultAsync<DBGroup, Error> => {
	const parsedInputResult = validateZodSchema(newDBGroup, insertGroupSchema, "NewDBGroup");

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const parsedInput = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db
			.insert(groups)
			.values(parsedInput)
			.onConflictDoUpdate({
				target: groups.id,
				set: { name: parsedInput.name },
			})
			.returning()
			.then(([group]) => group),
		ensureError,
	);
};
