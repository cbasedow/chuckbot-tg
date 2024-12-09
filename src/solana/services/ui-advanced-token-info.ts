import { logger } from "$/utils/logger";
import { ResultAsync, okAsync } from "neverthrow";
import type { AdvancedTokenInfo, UIAdvancedTokenInfo } from "../schemas/advanced-token-info";
import { formatToUIAdvancedTokenInfo } from "../transformers/advanced-token-info";
import { fetchAllTimeHighPriceInfo } from "./all-time-high-price-info";
import { fetchFullTokenMetadata } from "./full-token-metadata";
import { fetchTokenMetrics } from "./token-metrics";
import { fetchTokenMintInfo } from "./token-mint-info";
import { fetchUITokenHoldersInfo } from "./ui-token-holders-info";

/**
 * Fetches the advanced token info and formats it to the UI format
 * @param address
 */
export const fetchUIAdvancedTokenInfo = (address: string): ResultAsync<UIAdvancedTokenInfo, Error> => {
	return fetchAdvancedTokenInfo(address)
		.mapErr((error) => {
			return error;
		})
		.andThen((advancedTokenInfo) => formatToUIAdvancedTokenInfo(advancedTokenInfo))
		.mapErr((error) => {
			const finalError = new Error(`Failed to format advanced token info for token ${address}: ${error.message}`);
			logger.error(finalError);
			return finalError;
		});
};

/**
 * Fetches advanced token info from all services
 * @param address
 */
const fetchAdvancedTokenInfo = (address: string): ResultAsync<AdvancedTokenInfo, Error> => {
	return fetchTokenMetrics(address)
		.andThen((metrics) => {
			return ResultAsync.combine([
				fetchFullTokenMetadata(metrics.baseTokenAddress),
				fetchTokenMintInfo(metrics.baseTokenAddress),
			])
				.map(([fullMetadata, mintInfo]) => {
					return {
						metrics,
						fullMetadata,
						mintInfo,
					};
				})
				.andThen(({ metrics, fullMetadata, mintInfo }) => {
					return ResultAsync.combine([
						fetchUITokenHoldersInfo({
							tokenAddress: metrics.baseTokenAddress,
							devAddress: mintInfo.devAddress,
							bondingCurveAddress: mintInfo.bondingCurveAddress,
							circulatingSupplyBn: fullMetadata.circulatingSupplyBn,
						}),
						["moonshot", "pumpfun"].includes(metrics.poolName)
							? okAsync(null)
							: fetchAllTimeHighPriceInfo(metrics.baseTokenAddress, mintInfo.mintedAt),
					]).map(([uiHoldersInfo, allTimeHighPriceInfo]) => {
						return {
							metrics,
							fullMetadata,
							mintInfo,
							uiHoldersInfo,
							allTimeHighPriceInfo,
						};
					});
				});
		})
		.mapErr((error) => {
			const finalError = new Error(`Failed to fetch advanced token info for token ${address}: ${error.message}`);
			logger.error(finalError);
			return finalError;
		});
};
