import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { and, eq } from "drizzle-orm";
import { ResultAsync, errAsync } from "neverthrow";
import { z } from "zod";
import { db } from "..";
import { type DBRefLinkPlatform, refLinkPlatformEnum, refLinks } from "../schema";

const deleteRefLinkByPlatformAndGroupIdSchema = z.object({
	platform: z.enum(refLinkPlatformEnum.enumValues),
	groupId: z.number().int().negative(), // Telegram Group IDs are negative numbers
});

export const deleteRefLinkByPlatformAndGroupId = (
	platform: DBRefLinkPlatform,
	groupId: number,
): ResultAsync<void, Error> => {
	const parsedInputResult = validateZodSchema(
		{ platform, groupId },
		deleteRefLinkByPlatformAndGroupIdSchema,
		"deleteRefLinkByPlatformAndGroupId",
	);

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const { platform: validatedPlatform, groupId: validatedGroupId } = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db
			.delete(refLinks)
			.where(and(eq(refLinks.platform, validatedPlatform), eq(refLinks.groupId, validatedGroupId)))
			.then(() => void 0),
		ensureError,
	);
};
