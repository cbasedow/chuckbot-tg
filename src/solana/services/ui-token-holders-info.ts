import { logger } from "$/utils/logger";
import type BigNumber from "bignumber.js";
import type { ResultAsync } from "neverthrow";
import type { UITokenHoldersInfo } from "../schemas/ui-token-holders-info";
import { extractUITokenHoldersInfo } from "../transformers/token-holders-account-info";
import { fetchTokenHoldersAccountInfo } from "./solana-rpc";

type FetchUITokenHoldersInfoParams = {
	tokenAddress: string;
	devAddress: string;
	bondingCurveAddress: string | null;
	circulatingSupplyBn: BigNumber;
};

/**
 * Fetches UI token holders info from Solana RPC
 * @param tokenAddress - Base58 encoded Solana address
 * @param devAddress - Base58 encoded Solana address
 * @param bondingCurveAddress - Base58 encoded Solana address
 * @param circulatingSupplyBn - BigNumber
 */
export const fetchUITokenHoldersInfo = ({
	tokenAddress,
	devAddress,
	bondingCurveAddress,
	circulatingSupplyBn,
}: FetchUITokenHoldersInfoParams): ResultAsync<UITokenHoldersInfo, Error> => {
	return fetchTokenHoldersAccountInfo(tokenAddress)
		.andThen((holdersAccountInfo) => {
			return extractUITokenHoldersInfo({
				holdersAccountInfo,
				devAddress,
				bondingCurveAddress,
				circulatingSupplyBn,
			});
		})
		.mapErr((error) => {
			const finalError = new Error(
				`Failed to fetch UI token holders info for token address ${tokenAddress}: ${error.message}`,
			);
			logger.error(finalError);
			return finalError;
		});
};
