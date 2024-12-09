import { validateZodSchema } from "$/utils/validate-zod-schema";
import BigNumber from "bignumber.js";
import type { Result } from "neverthrow";
import type { MoonshotPair, Pair } from "../schemas/dexscreener";
import type { TokenDetails } from "../schemas/pumpfun";
import {
	type DexScreenerTokenMetrics,
	type PumpFunTokenMetrics,
	dexscreenerTokenMetricsSchema,
	pumpfunTokenMetricsSchema,
} from "../schemas/token-metrics";

const isMoonshotPair = (pair: Pair): pair is MoonshotPair => {
	return pair.dexId === "moonshot";
};

export const extractDexscreenerMetrics = (pairs: Pair[]): Result<DexScreenerTokenMetrics, Error> => {
	const mainPair = pairs[0]; // The main pair is always the first pair in the array
	const isMoonshot = isMoonshotPair(mainPair);

	const dexscreenerMetrics: DexScreenerTokenMetrics = {
		poolName: mainPair.dexId,
		poolAddress: mainPair.pairAddress,
		pairCreatedAt: mainPair.pairCreatedAt / 1000,
		baseTokenAddress: mainPair.baseToken.address,
		quoteTokenAddress: mainPair.quoteToken.address,
		priceSolBn: new BigNumber(mainPair.priceNative),
		priceUsdBn: new BigNumber(mainPair.priceUsd),
		mcapUsdBn: new BigNumber(mainPair.fdv),
		liquidityUsdBn: isMoonshot ? null : new BigNumber(mainPair.liquidity.usd),
		volume1hUsdBn: new BigNumber(mainPair.volume.h1),
		totalBuys1h: mainPair.txns.h1.buys,
		totalSells1h: mainPair.txns.h1.sells,
		priceChange1hPercent: mainPair.priceChange.h1,
		bondingProgress: isMoonshot ? (mainPair.moonshot.progress ?? null) : null,
	};

	return validateZodSchema(dexscreenerMetrics, dexscreenerTokenMetricsSchema, "DexScreener token metrics");
};

export const extractPumpfunMetrics = (tokenDetails: TokenDetails): Result<PumpFunTokenMetrics, Error> => {
	const {
		mint,
		virtual_sol_reserves,
		virtual_token_reserves,
		total_supply,
		inverted,
		king_of_the_hill_timestamp,
		market_cap,
		usd_market_cap,
	} = tokenDetails;

	const virtualSolReservesBn = new BigNumber(virtual_sol_reserves).shiftedBy(-9);
	const virtualTokenReservesBn = new BigNumber(virtual_token_reserves).shiftedBy(-9);

	const totalSupplyBn = new BigNumber(total_supply).shiftedBy(-9);

	const mcapSolBn = new BigNumber(market_cap);
	const mcapUsdBn = new BigNumber(usd_market_cap);

	const priceUsdBn = mcapUsdBn.div(totalSupplyBn);

	const solPriceUsdBn = mcapUsdBn.div(mcapSolBn);
	const priceSolBn = mcapSolBn.div(totalSupplyBn);

	// Calculate liquidity based on which reserve represents SOL
	const liquidityUsdBn = inverted
		? virtualTokenReservesBn.multipliedBy(solPriceUsdBn).multipliedBy(2)
		: virtualSolReservesBn.multipliedBy(solPriceUsdBn).multipliedBy(2);

	const pumpfunMetrics: PumpFunTokenMetrics = {
		poolName: "pumpfun",
		baseTokenAddress: mint,
		priceSolBn,
		priceUsdBn,
		mcapUsdBn,
		liquidityUsdBn,
		reachedKothAt: king_of_the_hill_timestamp ? king_of_the_hill_timestamp / 1000 : null,
	};

	return validateZodSchema(pumpfunMetrics, pumpfunTokenMetricsSchema, "PumpFun token metrics");
};
