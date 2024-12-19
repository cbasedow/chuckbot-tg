import { insertFullSplToken } from "$/db/inserts/insert-full-spl-token";
import { getFullSplTokenByTokenOrPoolAddress } from "$/db/queries/get-full-spl-token-by-token-or-pool-address";
import type { DBAllTimeHighPriceInfo, DBFullSplToken, NewDBAthPriceInfo } from "$/db/schema";
import { updateFullSplToken } from "$/db/updates/update-full-spl-token";
import { logger } from "$/utils/logger";
import BigNumber from "bignumber.js";
import { ResultAsync, okAsync } from "neverthrow";
import type { AdvancedTokenInfo, UIAdvancedTokenInfo } from "../schemas/advanced-token-info";
import type { AllTimeHighPriceInfo } from "../schemas/all-time-high-price-info";
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
	return getFullSplTokenByTokenOrPoolAddress(address)
		.andThen((DBFullSplToken) => {
			logger.debug(`Found SPL token ${address} in the database`);
			return handleExisitingSplToken(DBFullSplToken);
		})
		.orElse(() => {
			logger.debug(`Did not find SPL token ${address} in the database`);
			return handleNewSplToken(address);
		});
};

const handleNewSplToken = (address: string): ResultAsync<AdvancedTokenInfo, Error> => {
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
					]).map(async ([uiHoldersInfo, allTimeHighPriceInfo]) => {
						// Attempt to insert new token into the database
						await insertFullSplToken({
							address: metrics.baseTokenAddress,
							poolAddress: "poolAddress" in metrics ? metrics.poolAddress : null,
							mintInfo: {
								mintSource: mintInfo.mintSource,
								mintedAtUnix: mintInfo.mintedAt,
								devAddress: mintInfo.devAddress,
								bondingCurveAddress: mintInfo.bondingCurveAddress ?? null,
								tokenAddress: metrics.baseTokenAddress,
							},
							athPriceInfo: allTimeHighPriceInfo
								? {
										priceUsd: allTimeHighPriceInfo.priceUsdBn.toString(),
										reachedAtUnix: allTimeHighPriceInfo.reachedAt,
										lastQueryTimeToUnix: allTimeHighPriceInfo.lastQueryTimeTo,
										tokenAddress: metrics.baseTokenAddress,
									}
								: null,
						}).match(
							() => logger.debug(`Inserted SPL token ${metrics.baseTokenAddress} into the database`),
							(error) =>
								logger.error(
									`Failed to insert SPL token ${metrics.baseTokenAddress} into the database: ${error.message}`,
								),
						);

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

type AthPriceInfoToUpdate = {
	exists: true;
	data: {
		tokenAddress: string;
		lastQueryTimeToUnix: number;
		priceUsd?: string;
		reachedAtUnix?: number;
	};
};

type AthPriceInfoToInsert = {
	exists: false;
	data: NewDBAthPriceInfo;
};

const handleExisitingSplToken = (dbFullSplToken: DBFullSplToken): ResultAsync<AdvancedTokenInfo, Error> => {
	const { address, mintInfo: dbMintInfo, athPriceInfo: dbAthPriceInfo } = dbFullSplToken;

	return ResultAsync.combine([
		fetchTokenMetrics(address),
		fetchFullTokenMetadata(address),
		dbMintInfo
			? okAsync({
					...dbMintInfo,
					mintedAt: dbMintInfo.mintedAtUnix,
				})
			: fetchTokenMintInfo(address),
	])
		.map(([metrics, fullMetadata, mintInfo]) => {
			return {
				metrics,
				fullMetadata,
				mintInfo,
			};
		})
		.andThen(({ metrics, fullMetadata, mintInfo }) => {
			let timeFrom: number;
			if (dbAthPriceInfo) {
				// The timeFrom will be the last timeTo timestamp used if we did
				timeFrom = dbAthPriceInfo.lastQueryTimeToUnix;
			} else {
				// Default to mint info minted at
				timeFrom = mintInfo.mintedAt;
			}

			return ResultAsync.combine([
				fetchUITokenHoldersInfo({
					tokenAddress: address,
					devAddress: mintInfo.devAddress,
					bondingCurveAddress: mintInfo.bondingCurveAddress,
					circulatingSupplyBn: fullMetadata.circulatingSupplyBn,
				}),
				!dbAthPriceInfo && ["moonshot", "pumpfun"].includes(metrics.poolName)
					? okAsync(null)
					: fetchAllTimeHighPriceInfo(address, timeFrom),
			]).map(async ([uiHoldersInfo, allTimeHighPriceInfo]) => {
				let athPriceInfo: AthPriceInfoToInsert | AthPriceInfoToUpdate | null = null;
				let actualAthPriceInfo: AllTimeHighPriceInfo | null = null;

				if (allTimeHighPriceInfo) {
					logger.debug({ allTimeHighPriceInfo });
					if (!dbAthPriceInfo) {
						actualAthPriceInfo = {
							priceUsdBn: allTimeHighPriceInfo.priceUsdBn,
							reachedAt: allTimeHighPriceInfo.reachedAt,
							lastQueryTimeTo: allTimeHighPriceInfo.lastQueryTimeTo,
						};

						athPriceInfo = {
							exists: false,
							data: {
								priceUsd: allTimeHighPriceInfo.priceUsdBn.toString(),
								reachedAtUnix: allTimeHighPriceInfo.reachedAt,
								lastQueryTimeToUnix: allTimeHighPriceInfo.lastQueryTimeTo,
								tokenAddress: address,
							},
						};
					}

					if (dbAthPriceInfo) {
						const isNewAth = allTimeHighPriceInfo.priceUsdBn.gt(new BigNumber(dbAthPriceInfo.priceUsd));
						actualAthPriceInfo = {
							lastQueryTimeTo: allTimeHighPriceInfo.lastQueryTimeTo,
							priceUsdBn: isNewAth ? allTimeHighPriceInfo.priceUsdBn : new BigNumber(dbAthPriceInfo.priceUsd),
							reachedAt: isNewAth ? allTimeHighPriceInfo.reachedAt : dbAthPriceInfo.reachedAtUnix,
						};

						athPriceInfo = {
							exists: true,
							data: {
								lastQueryTimeToUnix: allTimeHighPriceInfo.lastQueryTimeTo,
								tokenAddress: address,
								// Only update the price and reachedAt if it's a new ATH
								...(isNewAth
									? {
											priceUsd: allTimeHighPriceInfo.priceUsdBn.toString(),
											reachedAtUnix: allTimeHighPriceInfo.reachedAt,
										}
									: undefined),
							},
						};
					}
				}

				await updateFullSplToken({
					address,
					poolAddress: "poolAddress" in metrics ? metrics.poolAddress : null,
					mintInfoExists: Boolean(dbMintInfo),
					mintInfo: {
						...mintInfo,
						mintedAtUnix: mintInfo.mintedAt,
						tokenAddress: address,
					},
					athPriceInfo: athPriceInfo ?? null,
				}).match(
					() => logger.debug(`Updated SPL token ${address} in the database`),
					(error) => logger.error(`Failed to update SPL token ${address} in the database: ${error.message}`),
				);

				return {
					metrics,
					fullMetadata,
					mintInfo,
					uiHoldersInfo,
					allTimeHighPriceInfo: actualAthPriceInfo,
				};
			});
		});
};
