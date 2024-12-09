import { getGroupByIdWithRefLinks } from "$/db/queries/get-group-by-id-with-ref-links";
import { upsertDBGroup } from "$/db/upserts/upsert-group";
import { upsertDBUser } from "$/db/upserts/upsert-user";
import { logger } from "$/utils/logger";
import type { MiddlewareFn } from "grammy";
import type { Chat } from "grammy/types";
import type { MyContext } from "../types";

/**
 * Custom middleware to ensure the user and group data is available in the context
 * @param ctx
 * @param next
 */
export const ensureDBData: MiddlewareFn<MyContext> = async (ctx, next): Promise<void> => {
	if (!ctx.chat) {
		return await next();
	}

	ctx.dbData = {
		user: null,
		group: null,
	};

	// Ensure user and group data in the context
	await Promise.all([ensureUserData(ctx), ensureGroupData(ctx, ctx.chat)]);

	await next();
};

// Pass chat in separately since we check if it exists before calling this
const ensureGroupData = async (ctx: MyContext, chat: Chat): Promise<void> => {
	if (chat.type === "group" || chat.type === "supergroup") {
		const { id: groupId, title: groupName } = chat;

		await getGroupByIdWithRefLinks(groupId).match(
			(group) => {
				logger.debug(`Ensured group data for group ${groupId}`);
				ctx.dbData.group = group;
			},
			async (error) => {
				logger.debug(`Failed to get group data for group ${groupId}: ${error.message}`);
				await upsertDBGroup({
					id: groupId,
					name: groupName,
				}).match(
					(group) => {
						logger.debug(`Ensured group data for group ${groupId}`);
						ctx.dbData.group = {
							...group,
							refLinks: null, // Ref links will be null on group creation
						};
					},
					(error) => logger.error(`Failed to ensure group data for group ${groupId}: ${error.message}`),
				);
			},
		);
	}
};

const ensureUserData = async (ctx: MyContext): Promise<void> => {
	if (ctx.from) {
		const { id: userId, username } = ctx.from;

		await upsertDBUser({
			id: userId,
			username,
		}).match(
			(user) => {
				logger.debug(`Ensured user data for user ${userId}`);
				ctx.dbData.user = user;
			},
			(error) => logger.error(`Failed to ensure user data for user ${userId}: ${error.message}`),
		);
	}
};
