import { solanaBase58AddressSchema } from "$/solana/schemas/solana";
import { ensureError } from "$/utils/ensure-error";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import { eq, sql } from "drizzle-orm";
import { ResultAsync, errAsync } from "neverthrow";
import { z } from "zod";
import { db } from "..";
import {
	allTimeHighPriceInfo,
	insertAllTimeHighPriceInfoSchema,
	insertTokenMintInfoSchema,
	splTokens,
	tokenMintInfo,
} from "../schema";

const updateFullSplTokenSchema = z.object({
	address: solanaBase58AddressSchema,
	poolAddress: solanaBase58AddressSchema.nullable(),
	mintInfoExists: z.boolean(),
	mintInfo: insertTokenMintInfoSchema.nullable(),
	athPriceInfo: insertAllTimeHighPriceInfoSchema.nullable(),
});
type UpdateFullSplToken = z.infer<typeof updateFullSplTokenSchema>;

export const updateFullSplToken = (updatedFullSplToken: UpdateFullSplToken): ResultAsync<void, Error> => {
	const parsedInputResult = validateZodSchema(updatedFullSplToken, updateFullSplTokenSchema, "UpdateFullSplToken");

	if (parsedInputResult.isErr()) {
		return errAsync(parsedInputResult.error);
	}

	const { address, poolAddress, mintInfoExists, mintInfo, athPriceInfo } = parsedInputResult.value;

	return ResultAsync.fromPromise(
		db.transaction(async (txn) => {
			await txn
				.update(splTokens)
				.set({
					scanCount: sql`${splTokens.scanCount} + 1`,
					updatedAt: new Date(),
					// Only update poolAddress if it's not null
					...(poolAddress
						? {
								poolAddress: sql`CASE WHEN ${splTokens.poolAddress} IS NULL THEN ${poolAddress} ELSE ${splTokens.poolAddress} END`,
							}
						: undefined),
				})
				.where(eq(splTokens.address, address));

			await Promise.all([
				mintInfo && !mintInfoExists ? txn.insert(tokenMintInfo).values(mintInfo) : null,
				athPriceInfo
					? txn
							.insert(allTimeHighPriceInfo)
							.values(athPriceInfo)
							.onConflictDoUpdate({
								target: allTimeHighPriceInfo.tokenAddress,
								set: {
									priceUsd: athPriceInfo.priceUsd,
									reachedAtUnix: athPriceInfo.reachedAtUnix,
									lastQueryTimeToUnix: athPriceInfo.lastQueryTimeToUnix,
								},
							})
					: null,
			]);
		}),
		ensureError,
	);
};
