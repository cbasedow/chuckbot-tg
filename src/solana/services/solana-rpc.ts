import { enhancedFetch } from "$/utils/enhanced-fetch";
import { handleEnhancedResponse } from "$/utils/handle-enhanced-response";
import { type ResultAsync, errAsync, okAsync } from "neverthrow";
import { HELIUS_RPC_BASE_REQUEST, HELIUS_RPC_URL, SOLANA_PROGRAM_IDS } from "../constants";
import { parsedProgramAccountsResponseSchema } from "../schemas/helius-rpc";
import type { ParsedTokenAccountInfo } from "../schemas/solana";
export const fetchTokenHoldersAccountsInfo = (tokenAddress: string): ResultAsync<ParsedTokenAccountInfo[], Error> => {
	return enhancedFetch(HELIUS_RPC_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			...HELIUS_RPC_BASE_REQUEST,
			method: "getProgramAccounts",
			params: [
				SOLANA_PROGRAM_IDS.SPL_TOKEN,
				{
					encoding: "jsonParsed",
					filters: [
						{
							dataSize: 165,
						},
						{
							memcmp: {
								offset: 0,
								bytes: tokenAddress,
							},
						},
					],
				},
			],
		}),
	})
		.andThen((response) =>
			handleEnhancedResponse(response, parsedProgramAccountsResponseSchema, "fetchTokenHolderAccountsInfo"),
		)
		.map((parsedData) => parsedData.result)
		.andThen((parsedAccounts) => {
			if (parsedAccounts.length === 0) {
				return errAsync(new Error("No token holders accounts found"));
			}

			// Only return the parsed token account info from each account
			return okAsync(parsedAccounts.map((parsedAccount) => parsedAccount.account.data.parsed.info));
		});
};
