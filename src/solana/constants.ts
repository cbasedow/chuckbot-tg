import { envConfig } from "env";

//* Birdeye API
export const BIRDEYE_API_URL = "https://public-api.birdeye.so";
export const BIRDEYE_BASE_HEADERS = {
	"Content-Type": "application/json",
	"X-API-Key": envConfig.BIRDEYE_API_KEY,
	"x-chain": "solana",
} as const;

//* Solana
export const SOLANA_BASE58_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
