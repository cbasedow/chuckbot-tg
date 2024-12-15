import { updatedGroupAddressListener } from "$/db/updates/update-group-address-listener";
import { logger } from "$/utils/logger";
import { Menu, type MenuFlavor } from "@grammyjs/menu";
import { fmt } from "@grammyjs/parse-mode";
import { EMOJIS } from "../constants";
import type { MyContext } from "../types";
import { isGroupAdmin } from "../utils/is-group-admin";

export const groupAddressListenerMenu = new Menu<MyContext>("group-address-listener-menu", {
	autoAnswer: false,
}).dynamic((ctx, range) => {
	const chatType = ctx.chat?.type;

	const { group, user } = ctx.dbData;

	if (!(group && user)) {
		return;
	}

	if (chatType !== "group" && chatType !== "supergroup") {
		return;
	}

	const handleListenerUpdate = async (ctx: MyContext & MenuFlavor, enable: boolean) => {
		if (ctx.from?.id !== user.id) {
			return await ctx.answerCallbackQuery({
				text: `Only user ${user.username ?? user.id} can currently ${enable ? "enable" : "disable"} the SPL address listener`,
				show_alert: true,
			});
		}

		if (!(await isGroupAdmin(ctx, user.id))) {
			return await ctx.answerCallbackQuery({
				text: `Only group admins can currently ${enable ? "enable" : "disable"} the SPL address listener`,
				show_alert: true,
			});
		}

		await ctx.answerCallbackQuery();
		await ctx.menu.close({ immediate: true });

		return await updatedGroupAddressListener(group.id, enable).match(
			async () => {
				logger.debug(`Updated SPL address listener for group ${group.name} to ${enable}`);
				return await ctx.replyFmt(
					fmt`${EMOJIS.GREEN_CHECK} User ${user.username ?? user.id} ${enable ? "enabled" : "disabled"} SPL address listener for group ${group.name} `,
				);
			},
			async (error) => {
				logger.error(`Failed to update SPL address listener to ${enable} for group ${group.name}: ${error.message}`);
				return await ctx.replyFmt(
					fmt`${EMOJIS.RED_X} An error occured ${enable ? "enabling" : "disabling"} SPL address listener for group ${group.name}. Please try again later`,
				);
			},
		);
	};

	range.text(group.addressListenerEnabled ? "Disable" : "Enable", async (ctx) => {
		await handleListenerUpdate(ctx, !group.addressListenerEnabled);
	});
});
