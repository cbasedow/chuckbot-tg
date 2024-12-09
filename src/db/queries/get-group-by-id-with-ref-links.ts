import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { eq } from "drizzle-orm";
import { ResultAsync, errAsync } from "neverthrow";
import { z } from "zod";
import { db } from "..";
import { type DBGroupWithRefLinks, groups } from "../schema";

const groupByIdSchema = z.object({
	id: z.number().int().negative(), // Telegram Group IDs are negative numbers
});

export const getGroupByIdWithRefLinks = (id: number): ResultAsync<DBGroupWithRefLinks, Error> => {
	const parsedInputResult = validateZodSchema({ id }, groupByIdSchema, "groupId");

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const { id: groupId } = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db.query.groups
			.findFirst({
				where: eq(groups.id, groupId),
				with: {
					refLinks: {
						with: {
							createdBy: true,
							updatedBy: true,
						},
					},
				},
			})
			.then((group) => {
				if (!group) {
					throw new Error(`Group with id ${groupId} not found`);
				}
				return group;
			}),
		ensureError,
	);
};
