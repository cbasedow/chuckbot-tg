import { constructUrlString } from "$/utils/construct-url-string";
import { enhancedFetch } from "$/utils/enhanced-fetch";
import { handleEnhancedResponse } from "$/utils/handle-enhanced-response";
import { type ResultAsync, errAsync, okAsync } from "neverthrow";
import { BIRDEYE_API_URL, BIRDEYE_BASE_HEADERS } from "../constants";
import {
	type OHLCVPrice,
	type RequestTimeInterval,
	type TokenCreationInfo,
	ohlcvPriceResponseSchema,
	tokenCreationInfoResponseSchema,
} from "../schemas/birdeye";

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

type FetchOHLCVParams = {
	tokenAddress: string;
	timeInterval: RequestTimeInterval;
	timeFrom: number;
	timeTo: number;
};

/**
 * Fetches OHLCV prices from Birdeye API
 * @param tokenAddress - Base58 encoded Solana address
 * @param timeInterval - The time interval to fetch OHLCV prices for
 * @param timeFrom - The start time in Unix timestamp seconds
 * @param timeTo - The end time in Unix timestamp seconds
 */
export const fetchOHLCVPrices = ({
	tokenAddress,
	timeInterval,
	timeFrom,
	timeTo,
}: FetchOHLCVParams): ResultAsync<OHLCVPrice[], Error> => {
	const url = constructUrlString(
		BIRDEYE_API_URL,
		{
			address: tokenAddress,
			type: timeInterval,
			time_from: timeFrom,
			time_to: timeTo,
		},
		"/defi/ohlcv",
	);

	return enhancedFetch(url, {
		method: "GET",
		headers: BIRDEYE_BASE_HEADERS,
	})
		.andThen((response) => handleEnhancedResponse(response, ohlcvPriceResponseSchema, "fetchOHLCVPrices"))
		.map((parsedData) => parsedData.data?.items)
		.andThen((ohlcvPrices) => {
			if (!ohlcvPrices || ohlcvPrices.length === 0) {
				return errAsync(new Error("No OHLCV prices found"));
			}

			return okAsync(ohlcvPrices);
		});
};
