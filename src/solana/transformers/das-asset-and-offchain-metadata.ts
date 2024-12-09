import { validateZodSchema } from "$/utils/validate-zod-schema";
import BigNumber from "bignumber.js";
import type { Result } from "neverthrow";
import {
	type FullTokenMetadata,
	type SocialUrl,
	type SocialUrlPlatform,
	fullTokenMetadataSchema,
} from "../schemas/full-token-metadata";
import type { DasAsset } from "../schemas/helius-rpc";
import type { OffchainMetadata } from "../schemas/offchain-metadata";

export const extractFullTokenMetadata = (
	dasAsset: DasAsset,
	offchainMetadata: OffchainMetadata | null,
): Result<FullTokenMetadata, Error> => {
	const { content, mutable, token_info } = dasAsset;

	const circulatingSupplyBn = new BigNumber(token_info.supply).shiftedBy(-token_info.decimals);

	const fullTokenMetadata: FullTokenMetadata = {
		name: content.metadata.name,
		symbol: content.metadata.symbol,
		circulatingSupplyBn,
		logoUrl: content.links?.image ?? null,
		isFreezable: Boolean(token_info.freeze_authority),
		isMintable: Boolean(token_info.mint_authority),
		isMutable: mutable,
		socialUrls: offchainMetadata ? extractSocialUrls(offchainMetadata) : [],
	};

	return validateZodSchema(fullTokenMetadata, fullTokenMetadataSchema, "FullTokenMetadata");
};

type DirectSocialUrlKey = Exclude<SocialUrlPlatform, "discord">;

const SOCIAL_URL_REGEX_CONFIG: Record<SocialUrlPlatform, RegExp> = {
	discord: /^(?:https:\/\/|www\.)?(discord\.(?:gg|com))\/(?:invite\/)?[a-zA-Z0-9-]+\/?$/i,
	telegram:
		/^(?:https:\/\/|www\.)?(t\.me|telegram\.me)\/(?:(?:c\/)?([a-zA-Z0-9_]{5,32})(?:\/\d+)?|joinchat\/[a-zA-Z0-9_-]+)$/i,
	twitter:
		/^(?:https:\/\/|www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})(?:\/(?:status|lists|moments)\/[\d]+)?(?:\/[^\s?]+)?(?:\?[^\s]*)?$/i,
	website:
		/^(?:https:\/\/|www\.)?(?!(?:twitter\.com|x\.com|t\.me|telegram\.me|instagram\.com|discord\.gg|discord\.com))([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/i,
};
const extractSocialUrls = (offchainMetadata: OffchainMetadata): SocialUrl[] => {
	const { description, extensions, websites, socials } = offchainMetadata;

	const socialUrlMap = new Map<SocialUrlPlatform, string>();

	// Extract all possible URLs from the offchain metadata
	const possibleUrlValues: string[] = [
		...Object.keys(SOCIAL_URL_REGEX_CONFIG).map((key) => offchainMetadata[key as DirectSocialUrlKey]),
		...(extensions ? Object.keys(extensions).map((key) => extensions[key as SocialUrlPlatform]) : []),
		...(socials?.map((social) => social.url) ?? []),
		...(websites?.map((website) => website.url) ?? []),
		...(description ? [description] : []),
	].filter((val): val is string => typeof val === "string");

	for (const val of possibleUrlValues) {
		for (const [platform, regex] of Object.entries(SOCIAL_URL_REGEX_CONFIG) as [SocialUrlPlatform, RegExp][]) {
			if (socialUrlMap.has(platform)) {
				continue;
			}

			const urlMatch = val.match(regex);

			if (urlMatch?.[0]) {
				let validUrl = urlMatch[0];

				// If the URL is missing a valid protocol, add it
				if (!(validUrl.startsWith("https://") || validUrl.startsWith("www."))) {
					validUrl = `https://${validUrl}`;
				}

				socialUrlMap.set(platform, validUrl);
			}
		}
	}

	if (socialUrlMap.size === 0) {
		return [];
	}

	return Array.from(socialUrlMap.entries()).map(([platform, url]) => ({
		platform,
		url,
	}));
};
