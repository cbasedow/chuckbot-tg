import { deleteRefLinkByPlatformAndGroupId } from "$/db/deletes/delete-ref-link-by-platform-and-group-id";
import type { DBGroupWithRefLinks, DBRefLinkPlatform, DBRefLinkWithUser, DBUser } from "$/db/schema";
import { upsertRefLinkByPlatformAndGroupId } from "$/db/upserts/upsert-ref-link-by-platform-and-group-id";
import { logger } from "$/utils/logger";
import { type FormattedString, bold, code, fmt, italic } from "@grammyjs/parse-mode";
import { EMOJIS } from "../constants";
import type { MyConversation, MyConversationContext, MyConversationMenu } from "../types";
import { formatFormattedStrings } from "../utils/format-formatted-strings";

type ManageRefParams = {
	selectedPlatform: DBRefLinkPlatform;
	selectedPlatformLabel: Capitalize<DBRefLinkPlatform>;
	action: "set" | "delete";
};

export const manageRef = async (conversation: MyConversation, ctx: MyConversationContext, params: ManageRefParams) => {
	const { selectedPlatform, selectedPlatformLabel, action } = params;
	try {
		const dbData = await conversation.external(async (ctx) => ctx.dbData);
		if (!(dbData.group && dbData.user)) {
			return await conversation.halt();
		}

		const { group, user } = dbData;

		const currRefLink = group.refLinks?.find((refLink) => refLink.platform === selectedPlatform) ?? null;

		const footerPromptLine = fmt`${EMOJIS.BULB} ${italic("Use /refs to view and manage more ref links")}`;

		if (currRefLink && action === "delete") {
			await handleRefLinkDelete(conversation, ctx, {
				selectedPlatformLabel,
				currRefLink,
				user,
				footerPromptLine,
			});
		} else if (action === "set") {
			await handleRefLinkSet(conversation, ctx, {
				selectedPlatform,
				selectedPlatformLabel,
				currRefLink,
				group,
				user,
				footerPromptLine,
			});
		}

		await conversation.waitUntil(() => false, {
			otherwise: (ctx) =>
				ctx.replyFmt(fmt`${bold("Please use the menu above to continue or leave the edit ref links operation!")}`),
		});
	} catch (error) {
		logger.error(`Error in manageRefs conversation: ${error}`);
		await conversation.halt();
	}
};

type HandleDeleteRefParams = {
	selectedPlatformLabel: Capitalize<DBRefLinkPlatform>;
	currRefLink: DBRefLinkWithUser;
	user: DBUser;
	footerPromptLine: FormattedString;
};

const handleRefLinkDelete = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
	params: HandleDeleteRefParams,
) => {
	const { selectedPlatformLabel, currRefLink } = params;

	const deleteFromToUrlLines: FormattedString[] = [
		fmt`${bold(italic("From:"))} ${code(currRefLink.url)}\n\n`,
		fmt`${bold(italic("To:"))} ${code("Not set")}\n\n`,
	];

	const deleteRefLinkLines: FormattedString[] = [
		fmt`${bold(`Are you sure you'd like to delete your ${selectedPlatformLabel} ref link?`)}\n\n`,
		...deleteFromToUrlLines,
	];

	const formattedDeleteRefLinkLines = formatFormattedStrings(deleteRefLinkLines);

	await ctx.replyFmt(formattedDeleteRefLinkLines, {
		link_preview_options: {
			is_disabled: true,
		},
		reply_markup: createConfirmDeleteRefMenu(conversation, {
			...params,
			deleteFromToUrlLines,
		}),
		...(ctx.msgId ? { reply_parameters: { message_id: ctx.msgId } } : undefined),
	});
};

const createConfirmDeleteRefMenu = (
	conversation: MyConversation,
	params: HandleDeleteRefParams & { deleteFromToUrlLines: FormattedString[] },
): MyConversationMenu => {
	const { selectedPlatformLabel, currRefLink, user, deleteFromToUrlLines, footerPromptLine } = params;

	return conversation
		.menu("confirm-delete-ref-menu", { autoAnswer: false })
		.text(`${EMOJIS.RED_X} Cancel`, async (ctx) => {
			if (ctx.from.id === user.id) {
				await ctx.answerCallbackQuery();
				await ctx.menu.close({ immediate: true });

				const cancelledLines: FormattedString[] = [
					fmt`${EMOJIS.STOP_SIGN} ${bold(`Cancelled deleting ${selectedPlatformLabel} ref link`)}\n\n`,
					footerPromptLine,
				];

				const formattedCancelledLines = formatFormattedStrings(cancelledLines);

				await ctx.replyFmt(formattedCancelledLines, {
					...(ctx.msgId ? { reply_parameters: { message_id: ctx.msgId } } : undefined),
				});
			} else {
				await ctx.answerCallbackQuery({
					text: `Only user ${user.username ?? user.id} can currently cancel deleting the ${selectedPlatformLabel} ref link`,
					show_alert: true,
				});
			}
		})
		.text(`${EMOJIS.GREEN_CHECK} Delete`, async (ctx) => {
			if (ctx.from.id === user.id) {
				await ctx.answerCallbackQuery();
				await ctx.menu.close({ immediate: true });

				const deleteRefResult = await conversation.external(async () => {
					return await deleteRefLinkByPlatformAndGroupId(currRefLink.platform, currRefLink.groupId);
				});

				await deleteRefResult.match(
					async () => {
						logger.debug(`Deleted ${selectedPlatformLabel} ref link for group ${currRefLink.groupId}`);

						const successLines: FormattedString[] = [
							fmt`${EMOJIS.GREEN_CHECK} ${bold(`Successfully deleted your ${selectedPlatformLabel} ref link`)}\n\n`,
							...deleteFromToUrlLines,
							footerPromptLine,
						];

						const formattedSuccessLines = formatFormattedStrings(successLines);

						await ctx.replyFmt(formattedSuccessLines, {
							...(ctx.msgId
								? {
										reply_parameters: {
											message_id: ctx.msgId,
										},
									}
								: undefined),
						});
						return await conversation.halt();
					},
					async (error) => {
						logger.error(
							`Error deleting ${selectedPlatformLabel} ref link for group ${currRefLink.groupId}: ${error.message}`,
						);
						await ctx.replyFmt(
							fmt`${EMOJIS.RED_X} ${bold(`Error deleting ${selectedPlatformLabel} ref link for group ${currRefLink.groupId}. Please try again later`)}`,
							{
								...(ctx.msgId
									? {
											reply_parameters: {
												message_id: ctx.msgId,
											},
										}
									: undefined),
							},
						);
						return await conversation.halt();
					},
				);
			} else {
				await ctx.answerCallbackQuery({
					text: `Only user ${user.username ?? user.id} can currently confirm deleting the ${selectedPlatformLabel} ref link`,
					show_alert: true,
				});
			}
		});
};

type HandleSetRefParams = {
	selectedPlatform: DBRefLinkPlatform;
	selectedPlatformLabel: Capitalize<DBRefLinkPlatform>;
	currRefLink: DBRefLinkWithUser | null;
	group: DBGroupWithRefLinks;
	user: DBUser;
	footerPromptLine: FormattedString;
};

const handleRefLinkSet = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
	params: HandleSetRefParams,
) => {
	const { selectedPlatformLabel, currRefLink, user } = params;

	const promptLines: FormattedString[] = [
		fmt`${bold(`Please enter the new ${selectedPlatformLabel} ref link URL`)}\n\n`,
		fmt`${italic("Note: Must be a valid URL beginning with https://")}`,
	];

	const formattedPromptLines = formatFormattedStrings(promptLines);

	await ctx.replyFmt(formattedPromptLines, {
		...(ctx.msgId ? { reply_parameters: { message_id: ctx.msgId } } : undefined),
	});

	const { message: newRefUrlMessage } = await conversation.waitFrom(user.id).andFor("message::url");

	if (!newRefUrlMessage.text) {
		await ctx.replyFmt(fmt`${EMOJIS.RED_X} ${bold(`No valid ${selectedPlatformLabel} ref link URL was entered.`)}`);
		return await conversation.halt();
	}

	const newRefUrl = newRefUrlMessage.text;

	if (newRefUrl === currRefLink?.url) {
		await ctx.replyFmt(
			fmt`${EMOJIS.RED_X} ${bold(`The new ${selectedPlatformLabel} ref link is the same as the current one. Operation cancelled.`)}`,
		);
		return await conversation.halt();
	}

	const fromToUrlLines: FormattedString[] = [
		fmt`${bold(italic("From:"))} ${code(currRefLink?.url ?? "Not set")}\n\n`,
		fmt`${bold(italic("To:"))} ${code(newRefUrl)}\n\n`,
	];

	const newUrlDetailsLines: FormattedString[] = [
		fmt`${bold(`Are you sure you'd like to set your ${selectedPlatformLabel} ref link?`)}\n\n`,
		...fromToUrlLines,
	];

	const formattedNewUrlDetailsLines = formatFormattedStrings(newUrlDetailsLines);

	await ctx.replyFmt(formattedNewUrlDetailsLines, {
		link_preview_options: {
			is_disabled: true,
		},
		reply_markup: createConfirmSetRefMenu(conversation, {
			...params,
			newRefUrl,
			fromToUrlLines,
		}),
		...(ctx.msgId ? { reply_parameters: { message_id: ctx.msgId } } : undefined),
	});
};

// Remove currRefLink from params since it's not used in this menu
type CreateConfirmSetRefParams = Omit<HandleSetRefParams, "currRefLink"> & {
	group: DBGroupWithRefLinks;
	newRefUrl: string;
	fromToUrlLines: FormattedString[];
};

const createConfirmSetRefMenu = (
	conversation: MyConversation,
	params: CreateConfirmSetRefParams,
): MyConversationMenu => {
	const { selectedPlatform, selectedPlatformLabel, user, group, newRefUrl, fromToUrlLines, footerPromptLine } = params;

	return conversation
		.menu("confirm-set-ref-menu", { autoAnswer: false })
		.text(`${EMOJIS.RED_X} Cancel`, async (ctx) => {
			if (ctx.from.id === user.id) {
				await ctx.answerCallbackQuery();
				await ctx.menu.close({ immediate: true });

				const cancelledLines: FormattedString[] = [
					fmt`${EMOJIS.STOP_SIGN} ${bold(`Cancelled setting ${selectedPlatformLabel} ref`)}\n\n`,
					footerPromptLine,
				];

				const formattedCancelledLines = formatFormattedStrings(cancelledLines);

				await ctx.replyFmt(formattedCancelledLines, {
					...(ctx.msgId
						? {
								reply_parameters: {
									message_id: ctx.msgId,
								},
							}
						: undefined),
				});
				await conversation.halt();
			} else {
				await ctx.answerCallbackQuery({
					text: `Only user ${user.username ?? user.id} can currently cancel setting the ${selectedPlatformLabel} ref link`,
					show_alert: true,
				});
			}
		})
		.text(`${EMOJIS.GREEN_CHECK} Set`, async (ctx) => {
			if (ctx.from.id === user.id) {
				await ctx.answerCallbackQuery();

				await ctx.menu.close({ immediate: true });

				// Upsert ref link to the database
				const upsertRefResult = await conversation.external(async () => {
					return await upsertRefLinkByPlatformAndGroupId({
						platform: selectedPlatform,
						url: newRefUrl,
						createdBy: user.id,
						updatedAt: new Date(),
						updatedBy: user.id,
						groupId: group.id,
					});
				});

				await upsertRefResult.match(
					async () => {
						logger.debug(`Successfully upserted ref link for ${selectedPlatformLabel} in group ${group.id}`);

						const formattedSuccessMessage = formatFormattedStrings([
							fmt`${EMOJIS.GREEN_CHECK} ${bold(`Successfully set new ${selectedPlatformLabel} ref link`)}\n\n`,
							...fromToUrlLines,
							footerPromptLine,
						]);

						await ctx.replyFmt(formattedSuccessMessage, {
							link_preview_options: {
								is_disabled: true,
							},
							...(ctx.msgId
								? {
										reply_parameters: {
											message_id: ctx.msgId,
										},
									}
								: undefined),
						});
						return await conversation.halt();
					},
					async (error) => {
						logger.error(`Error upserting ref link for ${selectedPlatformLabel} in group ${group.id}: ${error}`);
						await ctx.replyFmt(
							fmt`${EMOJIS.RED_X} ${bold(`An error occured setting ${selectedPlatformLabel} ref link. Please try again later`)}`,
							{
								...(ctx.msgId
									? {
											reply_parameters: {
												message_id: ctx.msgId,
											},
										}
									: undefined),
							},
						);
						return await conversation.halt();
					},
				);
			} else {
				await ctx.answerCallbackQuery({
					text: `Only user ${user.username ?? user.id} can currently set the ${selectedPlatformLabel} ref link`,
					show_alert: true,
				});
			}
		});
};
