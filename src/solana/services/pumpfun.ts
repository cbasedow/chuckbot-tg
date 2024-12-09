import { enhancedFetch } from "$/utils/enhanced-fetch";
import { handleEnhancedResponse } from "$/utils/handle-enhanced-response";
import type { ResultAsync } from "neverthrow";
import { PUMPFUN_API_URL } from "../constants";
import { type TokenDetails, tokenDetailsSchema } from "../schemas/pumpfun";

/**
 * Fetches token details from PumpFun API
 * @param tokenAddress
 */

export const fetchTokenDetails = (tokenAddress: string): ResultAsync<TokenDetails, Error> => {
	const url = `${PUMPFUN_API_URL}/coins/${tokenAddress}`;

	return enhancedFetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	}).andThen((response) => handleEnhancedResponse(response, tokenDetailsSchema));
};
