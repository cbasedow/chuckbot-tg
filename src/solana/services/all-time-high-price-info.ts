import { logger } from "$/utils/logger";
import type { ResultAsync } from "neverthrow";
import type { AllTimeHighPriceInfo } from "../schemas/all-time-high-price-info";
import type { RequestTimeInterval } from "../schemas/birdeye";
import { extractAllTimeHighPriceInfo } from "../transformers/ohlcv-prices";
import { fetchOHLCVPrices } from "./birdeye";

type TimeIntervalTuple = [RequestTimeInterval, number];
// Time intervals and their respective minimum ages in seconds
const TIME_INTERVALS: TimeIntervalTuple[] = [
	["1m", 0],
	["5m", 60000],
	["15m", 300000],
	["30m", 900000],
	["1H", 1800000],
	["2H", 3600000],
	["4H", 7200000],
	["6H", 14400000],
	["8H", 21600000],
	["12H", 28800000],
	["1D", 43200000],
	["3D", 86400000],
	["1W", 259200000],
	["1M", 604800000],
];

/**
 * Determines the request time interval based on the token age and the current timestamp
 * Adheres to Birdeye's 1000 item limit.
 * If the token age is less than the minimum age for the time interval, the previous time interval is used.
 */
const determineTimeInterval = (mintedAt: number, currTimestamp: number): RequestTimeInterval => {
	const tokenAge = currTimestamp - mintedAt;

	for (let i = 1; i < TIME_INTERVALS.length; i++) {
		const [, minimumAge] = TIME_INTERVALS[i];
		if (tokenAge < minimumAge) {
			return TIME_INTERVALS[i - 1][0];
		}
	}

	return "1M"; // Default to 1 month;
};

/**
 * Fetches all time high price info from Birdeye API
 * @param tokenAddress - Base58 encoded Solana address
 * @param mintedAt - The Unix timestamp in seconds when the token was minted
 * @returns
 */
export const fetchAllTimeHighPriceInfo = (
	tokenAddress: string,
	mintedAt: number,
): ResultAsync<AllTimeHighPriceInfo, Error> => {
	const currTimestampSecs = Math.floor(Date.now() / 1000);
	const timeInterval = determineTimeInterval(mintedAt, currTimestampSecs);

	return fetchOHLCVPrices({
		tokenAddress,
		timeInterval,
		timeFrom: mintedAt,
		timeTo: currTimestampSecs,
	})
		.andThen((ohlcvPrices) => extractAllTimeHighPriceInfo(ohlcvPrices))
		.mapErr((error) => {
			const finalError = new Error(
				`Failed to fetch all time high price info for token ${tokenAddress}: ${error.message}`,
			);
			logger.error(finalError);
			return finalError;
		});
};
