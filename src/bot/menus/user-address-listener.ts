import { updatedUserAddressListener } from "$/db/updates/update-user-address-listener";
import { logger } from "$/utils/logger";
import { Menu, type MenuFlavor } from "@grammyjs/menu";
import { fmt } from "@grammyjs/parse-mode";
import { EMOJIS } from "../constants";
import type { MyContext } from "../types";

export const userAddressListenerMenu = new Menu<MyContext>("user-address-listener-menu", {
	autoAnswer: false,
}).dynamic((ctx, range) => {
	const chatType = ctx.chat?.type;

	const user = ctx.dbData.user;

	if (!user) {
		return;
	}

	if (chatType !== "private") {
		return;
	}

	const handleListenerUpdate = async (ctx: MyContext & MenuFlavor, enable: boolean) => {
		logger.debug("Handle Listener Update");
		if (ctx.from?.id !== user.id) {
			return await ctx.answerCallbackQuery({
				text: `Only user ${user.username ?? user.id} can currently ${enable ? "enable" : "disable"} the SPL address listener`,
				show_alert: true,
			});
		}

		logger.debug("User Address Listener Menu Dynamic Handle Listener Update");

		await ctx.answerCallbackQuery();

		return await updatedUserAddressListener(user.id, enable).match(
			async () => {
				await ctx.menu.close({ immediate: true });
				logger.debug(`Updated SPL address listener for user ${user.username ?? user.id} to ${enable}`);
				return await ctx.replyFmt(fmt`${EMOJIS.GREEN_CHECK} ${enable ? "Enabled" : "Disabled"} SPL address listener`);
			},
			async (error) => {
				logger.error(
					`Failed to update SPL address listener to ${enable} for user ${user.username ?? user.id}: ${error.message}`,
				);
				return await ctx.replyFmt(
					fmt`${EMOJIS.RED_X} An error occured ${enable ? "enabling" : "disabling"} SPL address listener. Please try again later`,
				);
			},
		);
	};

	range.text(user.addressListenerEnabled ? "Disable" : "Enable", async (ctx) => {
		await handleListenerUpdate(ctx, !user.addressListenerEnabled);
	});
});
