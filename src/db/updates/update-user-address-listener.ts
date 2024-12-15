import { users } from "$/db/schema";
import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { eq } from "drizzle-orm";
import { ResultAsync, errAsync } from "neverthrow";
import { z } from "zod";
import { db } from "..";

const updateUserAddressListenerSchema = z.object({
	userId: z.number().min(1),
	isListenerEnabled: z.boolean(),
});

export const updatedUserAddressListener = (userId: number, isListenerEnabled: boolean): ResultAsync<void, Error> => {
	const parsedInputResult = validateZodSchema(
		{ userId, isListenerEnabled },
		updateUserAddressListenerSchema,
		"updateUserAddressListener",
	);

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}
	const { userId: validatedUserId, isListenerEnabled: validatedIsListenerEnabled } = parsedInputResult.value;
	return ResultAsync.fromPromise(
		db
			.update(users)
			.set({
				addressListenerEnabled: validatedIsListenerEnabled,
			})
			.where(eq(users.id, validatedUserId))
			.then(() => void 0),
		ensureError,
	);
};
