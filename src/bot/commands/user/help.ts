import { EMOJIS } from "$/bot/constants";
import type { MyContext } from "$/bot/types";
import { formatFormattedStrings } from "$/bot/utils/format-formatted-strings";
import { Command } from "@grammyjs/commands";
import { type FormattedString, bold, fmt, italic } from "@grammyjs/parse-mode";

export const helpCommand = new Command<MyContext>("help", "Help on how to use the bot", async (ctx) => {
	const helpLines: FormattedString[] = [fmt`${EMOJIS.BOOK} ${bold("How to use Chuckbot!")}\n\n`];

	const scanTokenLines: FormattedString[] = [
		fmt`${EMOJIS.MAG_GLASS} ${bold("SPL Token Scanning")}\n`,
		fmt`- ${bold(italic("Two ways to scan a token"))}\n`,
		fmt`${italic("1. /scan <token address> - Directly scans a token by address")}\n`,
		fmt`${italic("2. <token address> - Scans a SPL token address in any message (must be enabled in /listener)")}\n\n`,
	];

	helpLines.push(...scanTokenLines);

	if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
		const groupAdminLines: FormattedString[] = [
			fmt`${EMOJIS.LINK} ${bold("Group Referral Links")}\n`,
			fmt`- ${italic("Groups can have their own referral links to be displayed in the footer of each scanned SPL token message! This allows groups to be rewarded when their own referral links are used to trade.")}\n`,
			fmt`- ${italic("Admins can view and manage group referral links using /refs")}\n\n`,
			fmt`${EMOJIS.HEAR} ${bold("SPL Address Listener")}\n`,
			fmt`- ${italic("When enabled, the bot will listen for messages containing a valid SPL token address and automatically scan the token when it is sent.")}\n`,
			fmt`- ${italic("Admins can enable or disable the listener using /listener")}\n\n`,
		];

		helpLines.push(...groupAdminLines);
	} else {
		const userListenerLines: FormattedString[] = [
			fmt`${EMOJIS.HEAR} ${bold("SPL Address Listener")}\n`,
			fmt`- ${italic("When enabled, the bot will listen for messages containing a valid SPL token address and automatically scan the token when it is sent.")}\n`,
			fmt`- ${italic("Users can enable or disable the listener using /listener")}\n\n`,
		];

		helpLines.push(...userListenerLines);
	}

	// Bot feedback
	const feedbackLines: FormattedString[] = [
		fmt`${EMOJIS.MEMO} ${bold("Bot Feedback")}\n`,
		fmt`- ${italic("If you have any feedback or suggestions, please use /feedback to send your message to the bot's developer.")}\n\n`,
	];

	helpLines.push(...feedbackLines);

	const formattedHelpLines = formatFormattedStrings(helpLines);

	return await ctx.replyFmt(formattedHelpLines, {
		...(ctx.msgId ? { reply_to_message_id: ctx.msgId } : undefined),
	});
});
