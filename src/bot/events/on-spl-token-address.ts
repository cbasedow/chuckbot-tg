import type { MyBot, MyContext } from "$/bot/types";
import { handleScan } from "../utils/handle-scan";

export const GLOBAL_SOLANA_BASE58_ADDRESS_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/gi;

export const onSplTokenAddress = (bot: MyBot) => {
	bot
		.hears(GLOBAL_SOLANA_BASE58_ADDRESS_REGEX)
		.filter(hasAddressListenerEnabled)
		.use(async (ctx) => {
			const address = ctx.match[0];

			const { group, user } = ctx.dbData;

			if (!user) {
				return;
			}

			await handleScan(ctx, {
				address,
				user,
				group,
			});
		});
};

// Checks if the address listener is enabled for the current chat
const hasAddressListenerEnabled = (ctx: MyContext): boolean => {
	const { group, user } = ctx.dbData;
	const chatType = ctx.chat?.type;

	if (!user) {
		return false;
	}

	if (chatType === "private") {
		return user.addressListenerEnabled === true;
	}

	if (chatType === "group" || chatType === "supergroup") {
		return group?.addressListenerEnabled === true;
	}

	return false;
};
