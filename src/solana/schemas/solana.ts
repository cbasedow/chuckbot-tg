import { z } from "zod";
import { SOLANA_BASE58_ADDRESS_REGEX } from "../constants";

export const solanaBase58AddressSchema = z.string().regex(SOLANA_BASE58_ADDRESS_REGEX);
