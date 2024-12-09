import { enhancedFetch } from "$/utils/enhanced-fetch";
import { handleEnhancedResponse } from "$/utils/handle-enhanced-response";
import { logger } from "$/utils/logger";
import { type ResultAsync, errAsync, okAsync } from "neverthrow";
import { DEXSCREENER_API_URL } from "../constants";
import { type Pair, pairsResponseSchema } from "../schemas/dexscreener";

/**
 * Fetches pairs by pool address from DexScreener API
 * @param poolAddress
 */
const fetchPairsByPoolAddress = (poolAddress: string): ResultAsync<Pair[], Error> => {
	const url = `${DEXSCREENER_API_URL}/latest/dex/pairs/solana/${poolAddress}`;

	return enhancedFetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	})
		.andThen((response) => handleEnhancedResponse(response, pairsResponseSchema))
		.map((parsedData) => parsedData.pairs)
		.andThen((pairs) => {
			if (!pairs || pairs.length === 0) {
				return errAsync(new Error("No pairs found for pool address"));
			}

			return okAsync(pairs);
		});
};

/**
 * Fetches pairs by token address from DexScreener API
 * @param tokenAddress
 */
const fetchPairsByTokenAddress = (tokenAddress: string): ResultAsync<Pair[], Error> => {
	const url = `${DEXSCREENER_API_URL}/latest/dex/tokens/${tokenAddress}`;

	return enhancedFetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	})
		.andThen((response) => handleEnhancedResponse(response, pairsResponseSchema))
		.map((parsedData) => parsedData.pairs)
		.andThen((pairs) => {
			if (!pairs || pairs.length === 0) {
				return errAsync(new Error("No pairs found for token address"));
			}

			return okAsync(pairs);
		});
};

/**
 * Fetches pairs by first trying to fetch by token address and then by pool address
 * @param address
 */
export const fetchPairs = (address: string): ResultAsync<Pair[], Error> => {
	return fetchPairsByTokenAddress(address).orElse((error) => {
		logger.warn(`Failed to fetch pairs by token address: ${error.message}`);

		return fetchPairsByPoolAddress(address).mapErr((error) => {
			logger.warn(`Failed to fetch pairs by pool address: ${error.message}`);
			return new Error(`Failed to fetch pairs by pool and token address ${address}: ${error.message}`);
		});
	});
};
