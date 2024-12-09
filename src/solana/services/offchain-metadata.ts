import { enhancedFetch } from "$/utils/enhanced-fetch";
import { handleEnhancedResponse } from "$/utils/handle-enhanced-response";
import type { ResultAsync } from "neverthrow";
import { type OffchainMetadata, offchainMetadataSchema } from "../schemas/offchain-metadata";

/**
 * Fetches offchain metadata from JSON Uri
 * @param jsonUri - JSON URI from Das Asset
 */

export const fetchOffchainMetadata = (jsonUri: string): ResultAsync<OffchainMetadata, Error> => {
	return enhancedFetch(jsonUri, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	}).andThen((response) => handleEnhancedResponse(response, offchainMetadataSchema, "fetchOffchainMetadata"));
};
