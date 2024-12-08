import { enhancedFetch } from "$/utils/enhanced-fetch";
import { handleEnhancedResponse } from "$/utils/handle-enhanced-response";
import { type ResultAsync, errAsync, okAsync } from "neverthrow";
import { HELIUS_PARSE_TXNS_URL } from "../constants";
import { type EnhancedTxn, enhancedTxnSchema } from "../schemas/helius-enhanced-txn";

/**
 * Fetches enhanced transactions from Helius Parse Transactions API
 * @param txnSignatures - Transaction signatures
 */

export const fetchParsedTxns = (txnSignatures: string[]): ResultAsync<EnhancedTxn[], Error> => {
	return enhancedFetch(HELIUS_PARSE_TXNS_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			transactions: txnSignatures,
		}),
	})
		.andThen((response) => handleEnhancedResponse(response, enhancedTxnSchema.array(), "fetchParsedTxns"))
		.andThen((enhancedTxns) => {
			if (enhancedTxns.length === 0) {
				return errAsync(new Error("No enhanced transactions found"));
			}

			return okAsync(enhancedTxns);
		});
};
