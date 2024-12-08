import { validateZodSchema } from "$/utils/validate-zod-schema";
import bs58 from "bs58";
import { Result, err } from "neverthrow";
import { SOLANA_PROGRAM_IDS } from "../constants";
import type { EnhancedTxn } from "../schemas/helius-enhanced-txn";
import { type TokenMintInfo, type TokenMintSource, tokenMintInfoSchema } from "../schemas/token-mint-info";

const { METAPLEX, MOONSHOT, PUMPFUN, SPL_TOKEN } = SOLANA_PROGRAM_IDS;

type TokenMintStructConfig = {
	source: TokenMintSource;
	structType: number;
	devAddressIndex: number;
	bondingCurveAddressIndex: number | null;
};
const PROGRAM_MINT_STRUCT_CONFIG: Record<string, TokenMintStructConfig> = {
	// Metaplex Create
	[METAPLEX]: {
		source: "DEFAULT",
		structType: 43,
		devAddressIndex: 1,
		bondingCurveAddressIndex: null,
	},
	// Moonshot TokenMint Instruction
	[MOONSHOT]: {
		source: "MOONSHOT",
		structType: 3,
		devAddressIndex: 0,
		bondingCurveAddressIndex: 2,
	},
	// PumpFun Create Instruction
	[PUMPFUN]: {
		source: "PUMPFUN",
		structType: 24,
		devAddressIndex: 7,
		bondingCurveAddressIndex: 2,
	},
	// SPL MintTo Instruction
	[SPL_TOKEN]: {
		source: "DEFAULT",
		structType: 7,
		devAddressIndex: 2,
		bondingCurveAddressIndex: null,
	},
};

const decodeInstructionData = (data: string): Result<Buffer, Error> => {
	return Result.fromThrowable(
		() => Buffer.from(bs58.decode(data)),
		(error) => new Error(`Failed to decode instruction data: ${error}`),
	)();
};

export const extractTokenMintInfo = (txn: EnhancedTxn): Result<TokenMintInfo, Error> => {
	if (txn.instructions.length === 0) {
		return err(new Error(`No instructions found for transaction ${txn.signature}`));
	}

	for (const instruction of txn.instructions) {
		const { accounts, data, programId } = instruction;

		const programMintStruct = PROGRAM_MINT_STRUCT_CONFIG[programId];

		if (!programMintStruct) {
			continue;
		}

		const { source, structType, devAddressIndex, bondingCurveAddressIndex } = programMintStruct;

		const structBufferResult = decodeInstructionData(data);

		if (structBufferResult.isErr()) {
			return err(structBufferResult.error);
		}

		const structBuffer = structBufferResult.value;

		if (structBuffer.length === 0) {
			return err(new Error(`No instruction data found for transaction ${txn.signature}`));
		}

		if (structType === structBuffer[0]) {
			if (devAddressIndex >= accounts.length) {
				return err(new Error(`Dev address index out of bounds in accounts array for transaction ${txn.signature}`));
			}

			if (bondingCurveAddressIndex !== null && bondingCurveAddressIndex >= accounts.length) {
				return err(
					new Error(`Bonding curve address index out of bounds in accounts array for transaction ${txn.signature}`),
				);
			}

			const devAddress = accounts[devAddressIndex];
			const bondingCurveAddress = bondingCurveAddressIndex !== null ? accounts[bondingCurveAddressIndex] : null;

			const tokenMintInfo: TokenMintInfo = {
				mintSource: source,
				mintedAt: txn.timestamp,
				devAddress,
				bondingCurveAddress,
			};

			return validateZodSchema(tokenMintInfo, tokenMintInfoSchema, `token mint info for transaction ${txn.signature}`);
		}
	}

	return err(new Error(`No matching token mint instruction found for transaction ${txn.signature}`));
};
