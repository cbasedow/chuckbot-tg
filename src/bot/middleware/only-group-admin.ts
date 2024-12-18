import { logger } from "$/utils/logger";
import { bold, fmt } from "@grammyjs/parse-mode";
import type { NextFunction } from "grammy";
import { EMOJIS } from "../constants";
import type { MyContext } from "../types";

export const onlyGroupAdmin = (customMessage?: string) => {
	return async (ctx: MyContext, next: NextFunction) => {
		// Early return if the context is not available
		if (!(ctx.chat && ctx.from?.id)) {
			logger.debug("No chat or user context available in OnlyGroupAdmin middleware");
			return;
		}

		const chatType = ctx.chat.type;

		// Return early message if the chat type is not a group or supergroup
		if (chatType !== "group" && chatType !== "supergroup") {
			return await ctx.replyFmt(fmt`${EMOJIS.STOP_SIGN} ${bold("Refs command can only be used in groups")}`);
		}

		// Allow anonymous admin bots
		if (ctx.from?.username === "GroupAnonymousBot") {
			await next();
		}

		try {
			const chatMember = await ctx.getChatMember(ctx.from.id);

			if (chatMember.status === "administrator" || chatMember.status === "creator") {
				await next();
			}

			// Non admin reply message
			const message = customMessage ?? "Only group admins can use this command";
			return await ctx.replyFmt(fmt`${EMOJIS.STOP_SIGN} ${bold(message)}`);
		} catch (error) {
			logger.error(`Failed to get chat member for user ${ctx.from.id} in OnlyGroupAdmin middleware: ${error}`);
			return;
		}
	};
};
