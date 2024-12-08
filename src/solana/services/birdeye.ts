import { enhancedFetch } from "$/utils/enhanced-fetch";
import { handleEnhancedResponse } from "$/utils/handle-enhanced-response";
import { type ResultAsync, errAsync, okAsync } from "neverthrow";
import { BIRDEYE_API_URL, BIRDEYE_BASE_HEADERS } from "../constants";
import { type TokenCreationInfo, tokenCreationInfoResponseSchema } from "../schemas/birdeye";

/**
 * Fetches token creation info from Birdeye API
 * @param tokenAddress - Base58 encoded Solana address
 */
export const fetchTokenCreationInfo = (tokenAddress: string): ResultAsync<TokenCreationInfo, Error> => {
	const url = `${BIRDEYE_API_URL}/defi/token_creation_info?address=${tokenAddress}`;

	return enhancedFetch(url, {
		method: "GET",
		headers: BIRDEYE_BASE_HEADERS,
	})
		.andThen((response) => handleEnhancedResponse(response, tokenCreationInfoResponseSchema, "fetchTokenCreationInfo"))
		.map((parsedData) => parsedData.data)
		.andThen((tokenCreationInfo) => {
			if (!tokenCreationInfo) {
				return errAsync(new Error("No token creation info found"));
			}

			return okAsync(tokenCreationInfo);
		});
};
