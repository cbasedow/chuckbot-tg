import { ensureError } from "$/utils/ensure-error";
import { eq, or } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { db } from "..";
import { type DBFullSplToken, splTokens } from "../schema";

export const getFullSplTokenByTokenOrPoolAddress = (address: string): ResultAsync<DBFullSplToken, Error> => {
	return ResultAsync.fromPromise(
		db.query.splTokens
			.findFirst({
				where: or(eq(splTokens.address, address), eq(splTokens.poolAddress, address)),
				with: {
					mintInfo: true,
					athPriceInfo: true,
				},
			})
			.then((token) => {
				if (!token) {
					throw new Error(`SPL token with token or pool address ${address} not found`);
				}

				return token;
			}),
		ensureError,
	);
};
