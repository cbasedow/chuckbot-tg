import { EMOJIS } from "$/bot/constants";
import { groupAddressListenerMenu } from "$/bot/menus/group-address-listener";
import type { MyContext } from "$/bot/types";
import { formatFormattedStrings } from "$/bot/utils/format-formatted-strings";
import { logger } from "$/utils/logger";
import { Command } from "@grammyjs/commands";
import { type FormattedString, bold, code, fmt, italic } from "@grammyjs/parse-mode";

export const listenerCommand = new Command<MyContext>(
	"listener",
	"Enable or disable the SPL address listener for the group",
	async (ctx) => {
		logger.debug("Group Listener Command");

		if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
			return;
		}

		const { group } = ctx.dbData;

		if (!group) {
			return await ctx.reply("An error occured getting group data. Please try again later");
		}

		const addressListenerDetailsLines: FormattedString[] = [
			fmt`${bold(`${group.name} SPL Address Listener:`)} ${group.addressListenerEnabled ? code("Enabled") : code("Disabled")}\n\n`,
		];

		if (group.addressListenerEnabled) {
			addressListenerDetailsLines.push(fmt`${italic(`To disable, click "Disable" below ${EMOJIS.POINT_DOWN}`)}`);
		} else {
			addressListenerDetailsLines.push(fmt`${italic(`To enable, click "Enable" below ${EMOJIS.POINT_DOWN}`)}`);
		}

		const formattedAddressListenerDetails = formatFormattedStrings(addressListenerDetailsLines);

		await ctx.replyFmt(formattedAddressListenerDetails, {
			...(ctx.msgId ? { reply_to_message_id: ctx.msgId } : undefined),
			reply_markup: groupAddressListenerMenu,
		});
	},
).addToScope({
	type: "all_chat_administrators",
});
