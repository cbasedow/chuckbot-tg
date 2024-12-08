import { envConfig } from "env";

//* Birdeye API
export const BIRDEYE_API_URL = "https://public-api.birdeye.so";
export const BIRDEYE_BASE_HEADERS = {
	"Content-Type": "application/json",
	"X-API-Key": envConfig.BIRDEYE_API_KEY,
	"x-chain": "solana",
} as const;

//* Helius RPC
export const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${envConfig.HELIUS_API_KEY}`;
export const HELIUS_RPC_BASE_REQUEST = {
	jsonrpc: "2.0" as const,
	id: crypto.randomUUID(),
};

//* Helius Parse Transactions API
export const HELIUS_PARSE_TXNS_URL = `https://api.helius.xyz/v0/transactions?api-key=${envConfig.HELIUS_API_KEY}&commitment=confirmed`;

//* Solana
export const SOLANA_BASE58_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
