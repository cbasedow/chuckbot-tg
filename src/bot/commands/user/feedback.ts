import type { MyContext } from "$/bot/types";
import { Command } from "@grammyjs/commands";

export const feedbackCommand = new Command<MyContext>("feedback", "Send feedback to the team", async (ctx) => {
	return await ctx.conversation.enter("feedback-conversation");
});
