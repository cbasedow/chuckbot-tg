import { logger } from "$/utils/logger";
import type { MyContext } from "../types";

export const isGroupAdmin = async (ctx: MyContext, userId: number): Promise<boolean> => {
	try {
		const chatMember = await ctx.getChatMember(userId);

		return chatMember.status === "administrator" || chatMember.status === "creator";
	} catch (error) {
		logger.error(`Failed to get chat member for user ${userId}: ${error}`);
		return false;
	}
};
