import { EMOJIS } from "$/bot/constants";
import type { MyContext } from "$/bot/types";
import { formatFormattedStrings } from "$/bot/utils/format-formatted-strings";
import { Command } from "@grammyjs/commands";
import { type FormattedString, bold, fmt, italic, link } from "@grammyjs/parse-mode";

const ADD_TO_GROUP_URL = "https://t.me/official_chuckbot?startgroup=strgrp";

export const startCommand = new Command<MyContext>("start", "Show my greeting message", async (ctx) => {
	const chatType = ctx.chat?.type;
	const startLines: FormattedString[] = [
		fmt`${EMOJIS.HAND_WAVE} ${bold("Hello there! I'm ChuckBot, your friendly neighborhood bot here to help you navigate the Solana memecoin trenches!")}\n\n`,
		fmt`${bold(italic("What can I currently do for you?"))}\n`,
		fmt`${italic("- /scan <token address> - Directly scans a token by address")}\n`,
		fmt`${italic("- <token address> - Scans a SPL token address in any message (must be enabled in /listener)")}\n\n`,
	];

	if (chatType !== "group" && chatType !== "supergroup") {
		startLines.push(
			fmt`${bold(italic("I recomend you"))} ${link("add me", ADD_TO_GROUP_URL)} ${bold(italic("to your group to get started!"))}\n`,
		);
	}
	const groupLines: FormattedString[] = [
		fmt`${italic("- Groups can have their own referral links to be displayed in the footer of each scanned SPL token message! This allows groups to be rewarded when their own referral links are used to trade.")}\n`,
		fmt`${italic("- Admins can view and manage group referral links using /refs")}\n\n`,
	];

	const helpLines: FormattedString[] = [
		fmt`${bold(italic("Have any questions or feedback?"))}\n`,
		fmt`- ${italic("Use /feedback to send your message to the team!")}\n\n`,
	];

	const footerLines: FormattedString[] = [
		fmt`${bold(italic("ChuckBot is just getting started! More features will be added soon!"))}\n`,
	];

	startLines.push(...groupLines, ...helpLines, ...footerLines);

	const formattedStartLines = formatFormattedStrings(startLines);

	return await ctx.replyFmt(formattedStartLines, {
		...(ctx.msgId ? { reply_to_message_id: ctx.msgId } : undefined),
	});
});
