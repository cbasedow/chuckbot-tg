import { validateZodSchema } from "$/utils/validate-zod-schema";
import BigNumber from "bignumber.js";
import type { Result } from "neverthrow";
import { type AllTimeHighPriceInfo, allTimeHighPriceInfoSchema } from "../schemas/all-time-high-price-info";
import type { OHLCVPrice } from "../schemas/birdeye";

export const extractAllTimeHighPriceInfo = (ohlcvPrices: OHLCVPrice[]): Result<AllTimeHighPriceInfo, Error> => {
	// We check for empty array before extracting so we can get the first highest price info
	let highestPrice = ohlcvPrices[0].h;
	let highestPriceTime = ohlcvPrices[0].unixTime;

	for (let i = 1; i < ohlcvPrices.length; i++) {
		if (ohlcvPrices[i].h > highestPrice) {
			highestPrice = ohlcvPrices[i].h;
			highestPriceTime = ohlcvPrices[i].unixTime;
		}
	}

	const allTimeHighPriceInfo: AllTimeHighPriceInfo = {
		priceUsdBn: new BigNumber(highestPrice), // Conver to BigNumber for future calculations
		reachedAt: highestPriceTime,
		// The last timeTo value used to fetch OHLCV prices
		lastQueryTimeTo: ohlcvPrices[ohlcvPrices.length - 1].unixTime,
	};

	return validateZodSchema(allTimeHighPriceInfo, allTimeHighPriceInfoSchema, "All time high price info");
};
