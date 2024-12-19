import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { ResultAsync, errAsync } from "neverthrow";
import { db } from "..";
import { allTimeHighPriceInfo, insertFullSplTokenSchema, splTokens, tokenMintInfo } from "../schema";
import type { NewDBFullSplToken } from "../schema";

export const insertFullSplToken = (fullSplToken: NewDBFullSplToken): ResultAsync<void, Error> => {
	const parsedInputResult = validateZodSchema(fullSplToken, insertFullSplTokenSchema, "NewDBFullSplToken");

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const { mintInfo, athPriceInfo, ...splTokenFields } = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db.transaction(async (txn) => {
			await txn
				.insert(splTokens)
				.values(splTokenFields)
				.then(async () => {
					await Promise.all([
						mintInfo ? txn.insert(tokenMintInfo).values(mintInfo) : null,
						athPriceInfo ? txn.insert(allTimeHighPriceInfo).values(athPriceInfo) : null,
					]);
				});
		}),
		ensureError,
	);
};
