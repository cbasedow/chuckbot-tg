import { BigNumber } from "bignumber.js";
import { z } from "zod";

export const bigNumberSchema = z.custom<BigNumber>((val): val is BigNumber => BigNumber.isBigNumber(val), {
	message: "Expected a BigNumber",
});
