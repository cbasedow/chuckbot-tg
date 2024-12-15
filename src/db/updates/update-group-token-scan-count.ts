import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { eq, sql } from "drizzle-orm";
import { ResultAsync, errAsync } from "neverthrow";
import { z } from "zod";
import { db } from "..";
import { groups } from "../schema";

const groupIdSchema = z.number().int().negative();

export const updateGroupTokenScanCount = (groupId: number): ResultAsync<void, Error> => {
	const parsedInputResult = validateZodSchema(groupId, groupIdSchema, "groupId");
	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const validatedGroupId = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db
			.update(groups)
			.set({ tokenScanCount: sql`${groups.tokenScanCount} + 1` })
			.where(eq(groups.id, validatedGroupId))
			.then(() => void 0),
		ensureError,
	);
};
