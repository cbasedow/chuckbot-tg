import { logger } from "$/utils/logger";
import { type ResultAsync, okAsync } from "neverthrow";
import type { FullTokenMetadata } from "../schemas/full-token-metadata";
import { extractFullTokenMetadata } from "../transformers/das-asset-and-offchain-metadata";
import { fetchDasAsset } from "./das-asset";
import { fetchOffchainMetadata } from "./offchain-metadata";

/**
 * Fetches full token metadata from DAS asset and JSON Uri
 * @param tokenAddress - Base58 encoded Solana address
 */

export const fetchFullTokenMetadata = (tokenAddress: string): ResultAsync<FullTokenMetadata, Error> => {
	return fetchDasAsset(tokenAddress)
		.andThen((dasAsset) => {
			const jsonUrl = dasAsset.content.json_uri;

			// Return offchain metadata as null if the DAS asset doesn't have a JSON URI
			if (!jsonUrl) {
				return okAsync({
					dasAsset,
					offchainMetadata: null,
				});
			}

			return (
				fetchOffchainMetadata(jsonUrl)
					// Return null if the offchain metadata fetch fails
					.orElse((error) => {
						logger.warn(`Failed to fetch offchain metadata for token ${tokenAddress}: ${error.message}`);
						return okAsync(null);
					})
					.map((offchainMetadata) => {
						return {
							dasAsset,
							offchainMetadata,
						};
					})
			);
		})
		.andThen(({ dasAsset, offchainMetadata }) => extractFullTokenMetadata(dasAsset, offchainMetadata))
		.mapErr((error) => {
			const finalError = new Error(`Failed to fetch full token metadata for token ${tokenAddress}: ${error.message}`);
			logger.error(finalError);
			return finalError;
		});
};
