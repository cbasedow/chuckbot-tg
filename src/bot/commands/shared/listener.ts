import { EMOJIS } from "$/bot/constants";
import { groupAddressListenerMenu } from "$/bot/menus/group-address-listener";
import { userAddressListenerMenu } from "$/bot/menus/user-address-listener";
import type { MyContext } from "$/bot/types";
import { formatFormattedStrings } from "$/bot/utils/format-formatted-strings";
import { logger } from "$/utils/logger";
import { Command } from "@grammyjs/commands";
import { type FormattedString, bold, code, fmt, italic } from "@grammyjs/parse-mode";

export const listenerCommand = new Command<MyContext>(
	"listener",
	"Enable or disable the SPL address listener",
	async (ctx) => {
		logger.debug("Listener command called");

		const { group, user } = ctx.dbData;

		if (!user) {
			return;
		}

		if (ctx.chat.type === "private") {
			logger.debug("User address listener called");
			await handleUserListener(ctx, user.addressListenerEnabled);
		}
		if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
			if (!group) {
				return;
			}
			logger.debug("Group address listener called");
			await handleGroupListener(ctx, group.name, group.addressListenerEnabled);
		}
	},
);

const handleUserListener = async (ctx: MyContext, addressListenerEnabled: boolean) => {
	const addressListenerDetailsLines: FormattedString[] = [
		fmt`${bold("SPL Address Listener:")} ${addressListenerEnabled ? code("Enabled") : code("Disabled")}\n\n`,
	];

	if (addressListenerEnabled) {
		addressListenerDetailsLines.push(fmt`${italic(`To disable, click "Disable" below ${EMOJIS.POINT_DOWN}`)}`);
	} else {
		addressListenerDetailsLines.push(fmt`${italic(`To enable, click "Enable" below ${EMOJIS.POINT_DOWN}`)}`);
	}

	const formattedAddressListenerDetails = formatFormattedStrings(addressListenerDetailsLines);

	return await ctx.replyFmt(formattedAddressListenerDetails, {
		...(ctx.msgId ? { reply_to_message_id: ctx.msgId } : undefined),
		reply_markup: userAddressListenerMenu,
	});
};

const handleGroupListener = async (ctx: MyContext, groupName: string, addressListenerEnabled: boolean) => {
	const addressListenerDetailsLines: FormattedString[] = [
		fmt`${bold(`${groupName} SPL Address Listener:`)} ${addressListenerEnabled ? code("Enabled") : code("Disabled")}\n\n`,
	];

	if (addressListenerEnabled) {
		addressListenerDetailsLines.push(fmt`${italic(`To disable, click "Disable" below ${EMOJIS.POINT_DOWN}`)}`);
	} else {
		addressListenerDetailsLines.push(fmt`${italic(`To enable, click "Enable" below ${EMOJIS.POINT_DOWN}`)}`);
	}

	const formattedAddressListenerDetails = formatFormattedStrings(addressListenerDetailsLines);

	return await ctx.replyFmt(formattedAddressListenerDetails, {
		...(ctx.msgId ? { reply_to_message_id: ctx.msgId } : undefined),
		reply_markup: groupAddressListenerMenu,
	});
};
