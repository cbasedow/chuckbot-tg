import { logger } from "$/utils/logger";
import type { ResultAsync } from "neverthrow";
import type { TokenMintInfo } from "../schemas/token-mint-info";
import { extractTokenMintInfo } from "../transformers/enhanced-token-mint-txn";
import { fetchTokenCreationInfo } from "./birdeye";
import { fetchParsedTxns } from "./helius-parse-txns";

/**
 * Fetches token mint info from Birdeye and Helius Parse Transactions API
 * @param tokenAddress - Base58 encoded Solana address
 */

export const fetchTokenMintInfo = (tokenAddress: string): ResultAsync<TokenMintInfo, Error> => {
	return fetchTokenCreationInfo(tokenAddress)
		.andThen((tokenCreationInfo) => fetchParsedTxns([tokenCreationInfo.txHash]))
		.andThen((txns) => extractTokenMintInfo(txns[0]))
		.mapErr((error) => {
			const finalError = new Error(`Failed to fetch token mint for token ${tokenAddress}: ${error.message}`);
			logger.error(finalError);
			return finalError;
		});
};
