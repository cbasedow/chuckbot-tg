import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { ResultAsync, errAsync } from "neverthrow";
import { db } from "..";
import { type NewDBRefLink, insertRefLinkSchema, refLinks } from "../schema";

export const upsertRefLinkByPlatformAndGroupId = (newRefLink: NewDBRefLink): ResultAsync<void, Error> => {
	const parsedInputResult = validateZodSchema(newRefLink, insertRefLinkSchema, "NewDBRefLink");

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const validatedRefLink = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db
			.insert(refLinks)
			.values(validatedRefLink)
			.onConflictDoUpdate({
				target: [refLinks.platform, refLinks.groupId],
				set: {
					url: validatedRefLink.url,
					updatedAt: validatedRefLink.updatedAt,
					updatedBy: validatedRefLink.updatedBy,
				},
			})
			.then(() => void 0),
		ensureError,
	);
};
