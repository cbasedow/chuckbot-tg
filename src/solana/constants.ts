import { envConfig } from "env";

//* Birdeye API
export const BIRDEYE_API_URL = "https://public-api.birdeye.so";
export const BIRDEYE_BASE_HEADERS = {
	"Content-Type": "application/json",
	"X-API-Key": envConfig.BIRDEYE_API_KEY,
	"x-chain": "solana",
} as const;

//* DexScreener
export const DEXSCREENER_API_URL = "https://api.dexscreener.com";

//* Helius RPC
export const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${envConfig.HELIUS_API_KEY}`;
export const HELIUS_RPC_BASE_REQUEST = {
	jsonrpc: "2.0" as const,
	id: crypto.randomUUID(),
};

//* Helius Parse Transactions API
export const HELIUS_PARSE_TXNS_URL = `https://api.helius.xyz/v0/transactions?api-key=${envConfig.HELIUS_API_KEY}&commitment=confirmed`;

//* PumpFun API
export const PUMPFUN_API_URL = "https://frontend-api.pump.fun";

//* Solana
export const SOLANA_BASE58_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const GLOBAL_SOLANA_BASE58_ADDRESS_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/gi;

export const SOLANA_PROGRAM_IDS = {
	METAPLEX: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
	MOONSHOT: "MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG",
	PUMPFUN: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
	SPL_TOKEN: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
} as const;

//* Raydium
export const RAYDIUM_V4_AUTHORITY = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1";

//* Solscan Account URL
export const SOLSCAN_ACCOUNT_URL = "https://solscan.io/account";
