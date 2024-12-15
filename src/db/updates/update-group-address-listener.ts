import { groups } from "$/db/schema";
import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { eq } from "drizzle-orm";
import { ResultAsync, errAsync } from "neverthrow";
import { z } from "zod";
import { db } from "..";

const updateGroupAddressListenerSchema = z.object({
	groupId: z.number().int().negative(), // Telegram Group IDs are negative numbers
	isListenerEnabled: z.boolean(),
});

export const updatedGroupAddressListener = (groupId: number, isListenerEnabled: boolean): ResultAsync<void, Error> => {
	const parsedInputResult = validateZodSchema(
		{ groupId, isListenerEnabled },
		updateGroupAddressListenerSchema,
		"updateGroupAddressListener",
	);

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}
	const { groupId: validatedGroupId, isListenerEnabled: validatedIsListenerEnabled } = parsedInputResult.value;
	return ResultAsync.fromPromise(
		db
			.update(groups)
			.set({
				addressListenerEnabled: validatedIsListenerEnabled,
			})
			.where(eq(groups.id, validatedGroupId))
			.then(() => void 0),
		ensureError,
	);
};
