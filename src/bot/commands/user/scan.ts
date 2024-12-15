import { EMOJIS } from "$/bot/constants";
import type { MyContext } from "$/bot/types";
import { handleScan } from "$/bot/utils/handle-scan";
import { SOLANA_BASE58_ADDRESS_REGEX } from "$/solana/constants";
import { Command } from "@grammyjs/commands";
import { fmt } from "@grammyjs/parse-mode";

export const scanCommand = new Command<MyContext>("scan", "Scan a SPL token <address>", async (ctx) => {
	const address = ctx.match;

	if (!SOLANA_BASE58_ADDRESS_REGEX.test(address)) {
		return await ctx.replyFmt(fmt`${EMOJIS.RED_X} Invalid address`);
	}

	const dbData = ctx.dbData;

	const { group, user } = dbData;

	if (!user) {
		return await ctx.replyFmt(fmt`${EMOJIS.RED_X} An error occured getting user data. Please try again later`);
	}

	if (["group", "supergroup"].includes(ctx.chat.type) && !group) {
		return await ctx.replyFmt(fmt`${EMOJIS.RED_X} An error occured getting group data. Please try again later`);
	}

	return handleScan(ctx, {
		address,
		user,
		group,
	});
});
