import { logger } from "$/utils/logger";
import type { ResultAsync } from "neverthrow";
import type { TokenMetrics } from "../schemas/token-metrics";
import {
	extractDexscreenerMetrics,
	extractPumpfunMetrics,
} from "../transformers/dexscreener-pairs-or-pumpfun-token-details";
import { fetchPairs } from "./dexscreener";
import { fetchTokenDetails } from "./pumpfun";

/**
 * Fetches token metrics using Dexscreener Pairs or PumpFun Token Details
 * @param address
 */
export const fetchTokenMetrics = (address: string): ResultAsync<TokenMetrics, Error> => {
	return fetchPairs(address)
		.andThen((pairs) => extractDexscreenerMetrics(pairs))
		.orElse((error) => {
			logger.warn(`Failed to fetch Dexscreener metrics, attempting to fetch PumpFun metrics: ${error.message}`);

			return fetchTokenDetails(address).andThen((tokenDetails) => extractPumpfunMetrics(tokenDetails));
		})
		.mapErr((error) => {
			const finalError = new Error(`Failed to fetch token metrics for address ${address}: ${error.message}`);
			logger.error(finalError);
			return finalError;
		});
};
