import { formatCompactUsd } from "$/utils/format-compact-usd";
import { formatRelativeAge } from "$/utils/format-relative-age-string";
import { formatTokenPrice } from "$/utils/format-token-price";
import { validateZodSchema } from "$/utils/validate-zod-schema";
import type { Result } from "neverthrow";
import {
	type AdvancedTokenInfo,
	type UIAdvancedTokenInfo,
	uiAdvancedTokenInfoSchema,
} from "../schemas/advanced-token-info";
import type { DexScreenerTokenMetrics, TokenMetrics } from "../schemas/token-metrics";

const isDexscreenerMetrics = (metrics: TokenMetrics): metrics is DexScreenerTokenMetrics => {
	return "volume1hUsdBn" in metrics;
};

export const formatToUIAdvancedTokenInfo = (
	advancedTokenInfo: AdvancedTokenInfo,
): Result<UIAdvancedTokenInfo, Error> => {
	const { fullMetadata, mintInfo, uiHoldersInfo, allTimeHighPriceInfo, metrics } = advancedTokenInfo;

	const dexscreenerMetrics = isDexscreenerMetrics(metrics);

	// If the token is default and a dexscreener metrics, we use pairCreatedAt as the actual age
	const actualAge = dexscreenerMetrics && mintInfo.mintSource === "DEFAULT" ? metrics.pairCreatedAt : mintInfo.mintedAt;

	// If pool name is moonshot or pumpfun, it has not been migrated to a new DEX pool
	const hasMigrated = metrics.poolName !== "moonshot" && metrics.poolName !== "pumpfun";
	const migratedAge = hasMigrated && dexscreenerMetrics ? metrics.pairCreatedAt : null;

	const uiAth = allTimeHighPriceInfo
		? {
				uiMcapUsd: formatCompactUsd(
					allTimeHighPriceInfo.priceUsdBn.multipliedBy(fullMetadata.circulatingSupplyBn).toNumber(),
				),
				relativeAgeString: formatRelativeAge(allTimeHighPriceInfo.reachedAt),
			}
		: null;

	const uiVolume1h = dexscreenerMetrics
		? {
				uiUsd: formatCompactUsd(metrics.volume1hUsdBn.toNumber()),
				totalBuys: metrics.totalBuys1h,
				totalSells: metrics.totalSells1h,
			}
		: null;

	const uiAdvancedTokenInfo: UIAdvancedTokenInfo = {
		name: fullMetadata.name,
		address: metrics.baseTokenAddress,
		symbol: fullMetadata.symbol,
		logoUrl: fullMetadata.logoUrl,
		source: mintInfo.mintSource,
		relativeAgeString: formatRelativeAge(actualAge),
		migratedRelativeAgeString: migratedAge ? formatRelativeAge(migratedAge) : null,
		poolName: metrics.poolName,
		isFreezable: fullMetadata.isFreezable,
		isMintable: fullMetadata.isMintable,
		isMutable: fullMetadata.isMutable,
		socialUrls: fullMetadata.socialUrls,
		uiPriceUsd: formatTokenPrice(metrics.priceUsdBn.toNumber(), true),
		uiPriceChange1hPercent: dexscreenerMetrics ? metrics.priceChange1hPercent.toFixed(2) : null,
		uiMcapUsd: formatCompactUsd(metrics.mcapUsdBn.toNumber()),
		uiAllTimeHigh: uiAth,
		uiVolume1h,
		uiHoldersInfo,
		devAddress: mintInfo.devAddress,
	};

	return validateZodSchema(uiAdvancedTokenInfo, uiAdvancedTokenInfoSchema, "UI Advanced token info");
};
