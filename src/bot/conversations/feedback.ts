import type { MyConversation, MyConversationContext, MyConversationMenu } from "$/bot/types";
import type { DBUser } from "$/db/schema";
import { escapeMarkdownV2 } from "$/utils/escape-markdown-v2";
import { logger } from "$/utils/logger";
import { bold, fmt, italic } from "@grammyjs/parse-mode";
import { envConfig } from "env";
import { EMOJIS } from "../constants";

export const feedbackConversation = async (conversation: MyConversation, ctx: MyConversationContext) => {
	try {
		const dbData = await conversation.external((ctx) => ctx.dbData);

		const { user } = dbData;

		if (!user) {
			return await conversation.halt();
		}

		await handleFeedback(conversation, ctx, user);

		await conversation.waitUntil(() => false, {
			otherwise: (ctx) =>
				ctx.replyFmt(
					fmt`${EMOJIS.BULB} ${italic("Please enter feedback or click the cancel button to leave the feedback operation!")}`,
				),
		});
	} catch (error) {
		logger.error(`Error in feedback conversation: ${error}`);
		return await conversation.halt();
	}
};

const handleFeedback = async (conversation: MyConversation, ctx: MyConversationContext, user: DBUser) => {
	const chatId = ctx.chat?.id;
	if (!chatId) {
		return await conversation.halt();
	}

	const cancelFeedbackMenu = createCancelFeedbackMenu(conversation, {
		user,
		chatId,
	});

	const feedbackPromptMessage = await ctx.replyFmt(
		fmt`${EMOJIS.PENCIL} ${bold("Please enter your feedback to the team!")}`,
		{
			reply_markup: cancelFeedbackMenu,
			...(ctx.msgId ? { reply_parameters: { message_id: ctx.msgId } } : undefined),
		},
	);

	// wait for the user to send a message
	const { message: feedbackMessage } = await conversation.waitFrom(user.id).andFor("message:text");

	// Close the cancel menu
	await ctx.api.editMessageReplyMarkup(chatId, feedbackPromptMessage.message_id, undefined);

	const feedbackText = feedbackMessage.text;

	const feedbackChannelMessage = [
		`*${escapeMarkdownV2(`User ${user.username ?? user.id} submitted the following feedback:`)}*\n\n`,
		`${escapeMarkdownV2(feedbackText)}\n\n`,
	].join("");

	await ctx.api.sendMessage(envConfig.FEEDBACK_CHANNEL_ID, feedbackChannelMessage, {
		parse_mode: "MarkdownV2",
	});

	await ctx.replyFmt(fmt`${EMOJIS.GREEN_CHECK} ${bold("Your feedback has been sent to the team!")}`, {
		reply_parameters: {
			message_id: feedbackMessage.message_id,
		},
	});

	return await conversation.halt();
};

type CreateCancelFeedbackMenuParams = {
	user: DBUser;
	chatId: number;
};

const createCancelFeedbackMenu = (
	conversation: MyConversation,
	params: CreateCancelFeedbackMenuParams,
): MyConversationMenu => {
	const { user, chatId } = params;

	return conversation
		.menu("cancel-feedback-menu", { autoAnswer: false })
		.text(`${EMOJIS.RED_X} Cancel`, async (ctx) => {
			// Only allow the user who initiated the conversation to cancel
			if (ctx.from.id !== user.id) {
				return await ctx.answerCallbackQuery({
					text: `Only user ${user.username ?? user.id} can currently cancel the feedback conversation`,
					show_alert: true,
				});
			}
			await ctx.answerCallbackQuery();

			const messageId = ctx.msgId;
			if (!messageId) {
				return await conversation.halt();
			}

			// Delete the prompt message with the menu
			await ctx.api.deleteMessage(chatId, messageId);

			return await conversation.halt();
		});
};
