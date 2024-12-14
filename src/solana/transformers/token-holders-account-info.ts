import { validateZodSchema } from "$/utils/validate-zod-schema";
import BigNumber from "bignumber.js";
import FastPriorityQueue from "fastpriorityqueue";
import type { Result } from "neverthrow";
import { RAYDIUM_V4_AUTHORITY, SOLSCAN_ACCOUNT_URL } from "../constants";
import type { ParsedTokenAccountInfo } from "../schemas/solana";
import {
	type TokenHolder,
	type UITokenHolder,
	type UITokenHoldersInfo,
	uiTokenHoldersInfoSchema,
} from "../schemas/ui-token-holders-info";

type ExtractTokenHoldersInfoParams = {
	holdersAccountInfo: ParsedTokenAccountInfo[];
	devAddress: string;
	bondingCurveAddress: string | null;
	circulatingSupplyBn: BigNumber;
};

export const extractUITokenHoldersInfo = ({
	holdersAccountInfo,
	circulatingSupplyBn,
	devAddress,
	bondingCurveAddress,
}: ExtractTokenHoldersInfoParams): Result<UITokenHoldersInfo, Error> => {
	// Use BigInt to compare the raw amounts of each token holder account
	const comparatorFn = (a: ParsedTokenAccountInfo, b: ParsedTokenAccountInfo) => {
		return BigInt(a.tokenAmount.amount) < BigInt(b.tokenAmount.amount);
	};

	const minHeap = new FastPriorityQueue<ParsedTokenAccountInfo>(comparatorFn);

	let foundDev = false;
	let devHolderPercentBn = new BigNumber(0);

	for (const accountInfo of holdersAccountInfo) {
		const { owner, tokenAmount } = accountInfo;

		// Skip Raydium V4 authority account and Bonding Curve account
		if (owner === RAYDIUM_V4_AUTHORITY || owner === bondingCurveAddress) {
			continue;
		}

		if (!foundDev && owner === devAddress) {
			foundDev = true;

			// Calculate the percentage of the dev account if its greater than 0
			if (BigInt(tokenAmount.amount) > 0) {
				// Use uiAmountString to get the amount with the correct decimals
				const devHolderAmountBn = new BigNumber(tokenAmount.uiAmountString);
				devHolderPercentBn = devHolderAmountBn.div(circulatingSupplyBn).multipliedBy(100);
			}
		}

		if (minHeap.size < 10) {
			minHeap.add(accountInfo);
		} else {
			const lowestTopHolder = minHeap.peek() as ParsedTokenAccountInfo;

			if (BigInt(lowestTopHolder.tokenAmount.amount) < BigInt(accountInfo.tokenAmount.amount)) {
				// Replace the lowest top holder account info with the new one in one operation (replaceTop)
				minHeap.replaceTop(accountInfo);
			}
		}
	}

	const t10Holders: TokenHolder[] = new Array(minHeap.size);

	let t10HoldersPercentBn = new BigNumber(0);

	let i = minHeap.size - 1;

	while (minHeap.size > 0) {
		const accountInfo = minHeap.poll() as ParsedTokenAccountInfo;
		const { owner, tokenAmount } = accountInfo;

		const holderAmountBn = new BigNumber(tokenAmount.uiAmountString);
		const holderPercentBn = holderAmountBn.div(circulatingSupplyBn).multipliedBy(100);
		t10HoldersPercentBn = t10HoldersPercentBn.plus(holderPercentBn);

		t10Holders[i] = {
			address: owner,
			holderPercentBn,
		};

		i--;
	}

	const uiT5Holders: UITokenHolder[] = t10Holders.slice(0, 5).map((holder) => {
		return {
			address: holder.address,
			uiHolderPercent: holder.holderPercentBn.toFixed(2),
			solscanUrl: `${SOLSCAN_ACCOUNT_URL}/${holder.address}`,
		};
	});

	const uiDevHolder: UITokenHolder = {
		address: devAddress,
		uiHolderPercent: devHolderPercentBn.toFixed(2),
		solscanUrl: `${SOLSCAN_ACCOUNT_URL}/${devAddress}`,
	};

	const uiTokenHoldersInfo: UITokenHoldersInfo = {
		uiT10HoldersPercent: t10HoldersPercentBn.toFixed(2),
		uiDevHolder,
		uiT5Holders,
	};

	return validateZodSchema(uiTokenHoldersInfo, uiTokenHoldersInfoSchema, "Token holders info");
};
