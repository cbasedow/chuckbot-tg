import { enhancedFetch } from "$/utils/enhanced-fetch";
import { handleEnhancedResponse } from "$/utils/handle-enhanced-response";
import type { ResultAsync } from "neverthrow";
import { HELIUS_RPC_BASE_REQUEST, HELIUS_RPC_URL } from "../constants";
import { type DasAsset, dasAssetResponseSchema } from "../schemas/helius-rpc";

/**
 * Fetches DAS asset info from Helius RPC
 * @param tokenAddress - Base58 encoded Solana address
 */

export const fetchDasAsset = (tokenAddress: string): ResultAsync<DasAsset, Error> => {
	return enhancedFetch(HELIUS_RPC_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			...HELIUS_RPC_BASE_REQUEST,
			method: "getAsset",
			params: {
				id: tokenAddress,
			},
		}),
	})
		.andThen((response) => handleEnhancedResponse(response, dasAssetResponseSchema, "fetchDasAsset"))
		.map((parsedData) => parsedData.result);
};
