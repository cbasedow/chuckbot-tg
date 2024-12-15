import { EMOJIS } from "$/bot/constants";
import type { MyContext } from "$/bot/types";
import { formatFormattedStrings } from "$/bot/utils/format-formatted-strings";
import type { DBGroupWithRefLinks, DBRefLink, DBUser } from "$/db/schema";
import type { UIAdvancedTokenInfo } from "$/solana/schemas/advanced-token-info";
import type { TokenMintSource } from "$/solana/schemas/token-mint-info";
import { fetchUIAdvancedTokenInfo } from "$/solana/services/ui-advanced-token-info";
import { capitalizeFirstLetter } from "$/utils/capitalize-first-letter";
import { logger } from "$/utils/logger";
import { type FormattedString, bold, code, fmt, italic, link } from "@grammyjs/parse-mode";

type BaseRefLink = Pick<DBRefLink, "platform" | "url">;

// CHUCKBOT'S OWN REF LINKS
const DEFAULT_REF_LINKS: BaseRefLink[] = [
	{
		platform: "bonk",
		url: "chuckbot-bonk.io",
	},
	{
		platform: "bullx",
		url: "chuckbot-bullx.io",
	},
	{
		platform: "maestro",
		url: "chuckbot-maestro.io",
	},
	{
		platform: "photon",
		url: "chuckbot-photon.io",
	},
	{
		platform: "shuriken",
		url: "chuckbot-shuriken.io",
	},
	{
		platform: "trojan",
		url: "chuckbot-trojan.io",
	},
];

type HandleScanParams = {
	address: string;
	user: DBUser;
	group: DBGroupWithRefLinks | null;
};

export const handleScan = async (ctx: MyContext, params: HandleScanParams) => {
	const { address, user, group } = params;

	const groupRefLinks = group?.refLinks ?? [];

	await fetchUIAdvancedTokenInfo(address).match(
		async (uiAdvancedTokenInfo) => {
			const formattedAdvancedTokenInfo = formatAdvancedTokenInfo(uiAdvancedTokenInfo, groupRefLinks);

			await ctx.replyFmt(formattedAdvancedTokenInfo, {
				link_preview_options: {
					is_disabled: true,
				},
				...(ctx.msgId
					? {
							reply_parameters: {
								message_id: ctx.msgId,
							},
						}
					: undefined),
			});
		},
		async (error) => {
			logger.error(`Failed to scan token ${address}: ${error.message}`);
			await ctx.replyFmt(fmt`${EMOJIS.RED_X} An error occured scanning token ${address}. Please try again later`);
		},
	);
};

const SOURCE_EMOJIS_MAP: Record<TokenMintSource, string> = {
	PUMPFUN: EMOJIS.PILL,
	MOONSHOT: EMOJIS.CRESCENT_MOON,
	DEFAULT: EMOJIS.LABEL,
} as const;

const authorityEmoji = (bool: boolean) => (bool ? EMOJIS.POLICE_SIREN : EMOJIS.GREEN_CHECK);

const formatAdvancedTokenInfo = (
	uiAdvancedTokenInfo: UIAdvancedTokenInfo,
	groupRefLinks: BaseRefLink[],
): FormattedString => {
	const sourceEmoji = SOURCE_EMOJIS_MAP[uiAdvancedTokenInfo.source];

	const priceChange1hPercentLine = uiAdvancedTokenInfo.uiPriceChange1hPercent
		? fmt`${code(`[1h: ${uiAdvancedTokenInfo.uiPriceChange1hPercent}%]`)}`
		: "";

	const migratedAge = uiAdvancedTokenInfo.migratedRelativeAgeString
		? fmt`${code(`[migrated ${uiAdvancedTokenInfo.migratedRelativeAgeString} ago]`)}`
		: "";

	const tokenInfoLines: FormattedString[] = [
		fmt`${sourceEmoji} ${bold(uiAdvancedTokenInfo.name)} ${bold(`$${uiAdvancedTokenInfo.symbol.toUpperCase()}`)}\n`,
		fmt`${EMOJIS.EIGHT_BALL} ${bold(capitalizeFirstLetter(uiAdvancedTokenInfo.poolName))}\n`,
		fmt`${EMOJIS.MANTLE_CLOCK} ${bold("Age:")} ${code(uiAdvancedTokenInfo.relativeAgeString)} ${migratedAge}\n`,
		fmt`${EMOJIS.MONEY_WINGS} ${bold("Usd:")} ${code(uiAdvancedTokenInfo.uiPriceUsd)} ${priceChange1hPercentLine}\n`,
		fmt`${EMOJIS.GRAD_CAP} ${bold("Mcap:")} ${code(uiAdvancedTokenInfo.uiMcapUsd)}\n`,
	];

	// Add all time high if available
	if (uiAdvancedTokenInfo.uiAllTimeHigh) {
		tokenInfoLines.push(
			fmt`${EMOJIS.MOUNTAIN} ${bold("Ath:")} ${code(uiAdvancedTokenInfo.uiAllTimeHigh.uiMcapUsd)} ${code(`[${uiAdvancedTokenInfo.uiAllTimeHigh.relativeAgeString} ago]`)}\n`,
		);
	}

	// Add liquidity USD if available
	if (uiAdvancedTokenInfo.uiLiquidityUsd) {
		tokenInfoLines.push(fmt`${EMOJIS.DROPLET} ${bold("Liq:")} ${code(uiAdvancedTokenInfo.uiLiquidityUsd)}\n`);
	}

	if (uiAdvancedTokenInfo.uiVolume1h) {
		tokenInfoLines.push(
			fmt`${EMOJIS.BAR_CHART} ${bold("Vol1h:")} ${code(uiAdvancedTokenInfo.uiVolume1h.uiUsd)} ${code(`[B: ${uiAdvancedTokenInfo.uiVolume1h.totalBuys}, S: ${uiAdvancedTokenInfo.uiVolume1h.totalSells}]`)}\n`,
		);
	}

	const { uiT10HoldersPercent, uiDevHolder, uiT5Holders } = uiAdvancedTokenInfo.uiHoldersInfo;

	// Add ui holders info, authorities and socials
	const formattedT5Holders = formatFormattedStrings(
		uiT5Holders.map((holder) => fmt`${link(`${holder.uiHolderPercent}%`, holder.solscanUrl)} `),
	);
	tokenInfoLines.push(
		fmt`${EMOJIS.GEM} ${bold("T10:")} ${code(`[${uiT10HoldersPercent}%]`)} ${formattedT5Holders}\n`,
		fmt`${EMOJIS.MALE_DEV} ${bold("Dev:")} ${link(uiDevHolder.address.slice(-5), uiDevHolder.solscanUrl)} ${bold(italic(`holds ${uiDevHolder.uiHolderPercent}% of the supply`))}\n`,
		fmt`${EMOJIS.MAG_GLASS} ${bold("Mint:")} ${authorityEmoji(uiAdvancedTokenInfo.isMintable)} ${bold("Freeze:")} ${authorityEmoji(uiAdvancedTokenInfo.isFreezable)} ${bold("Mut:")} ${authorityEmoji(uiAdvancedTokenInfo.isMutable)}\n`,
	);

	// Add socials if available
	if (uiAdvancedTokenInfo.socialUrls.length > 0) {
		const formattedSocialUrls = formatFormattedStrings(
			uiAdvancedTokenInfo.socialUrls.map(
				(socialUrl) => fmt`[ ${link(capitalizeFirstLetter(socialUrl.platform), socialUrl.url)} ] `,
			),
		);

		tokenInfoLines.push(fmt`${EMOJIS.LINK} ${bold("Socials:")} ${formattedSocialUrls}\n\n`);
	}

	// Add contract address
	tokenInfoLines.push(fmt`${code(uiAdvancedTokenInfo.address)}\n\n`);

	// Add ref links
	const groupRefLinksMap = new Map(groupRefLinks.map((refLink) => [refLink.platform, refLink]));

	// If a ref link exists for the platform, use it, otherwise use the default ref link
	const mergedRefLinks = DEFAULT_REF_LINKS.map((defaultRef) => {
		const groupRefLink = groupRefLinksMap.get(defaultRef.platform);
		return groupRefLink ?? defaultRef;
	});
	const formatteRefLinks = formatFormattedStrings(
		mergedRefLinks.map((refLink) => fmt`[ ${link(capitalizeFirstLetter(refLink.platform), refLink.url)} ] `),
	);

	tokenInfoLines.push(fmt`${formatteRefLinks}`);

	return formatFormattedStrings(tokenInfoLines);
};
