import { EMOJIS, REF_PLATFORMS } from "$/bot/constants";
import { manageRefLinksMenu } from "$/bot/menus/manage-ref-links";
import type { MyContext } from "$/bot/types";
import { formatFormattedStrings } from "$/bot/utils/format-formatted-strings";
import type { DBGroupWithRefLinks } from "$/db/schema";
import { capitalizeFirstLetter } from "$/utils/capitalize-first-letter";
import { Command } from "@grammyjs/commands";
import { type FormattedString, bold, code, fmt, italic } from "@grammyjs/parse-mode";

export const refsCommand = new Command<MyContext>("refs", "View and manage group ref links", async (ctx) => {
	const messageId = ctx.msgId;
	const dbData = ctx.dbData;

	if (!(dbData.group && dbData.user)) {
		return await ctx.replyFmt(
			fmt`${EMOJIS.RED_X} ${bold("An error occured getting group and user data. Please try again later")}`,
		);
	}

	await ctx.replyFmt(formatRefLinksMessage(dbData.group), {
		link_preview_options: {
			is_disabled: true,
		},
		reply_markup: manageRefLinksMenu,
		reply_parameters: {
			message_id: messageId,
		},
	});
}).addToScope({
	type: "all_chat_administrators",
});

export const formatRefLinksMessage = (group: DBGroupWithRefLinks): FormattedString => {
	return formatFormattedStrings([
		fmt`${EMOJIS.LINK} ${bold(`${group.name} Ref Links`)}\n\n`,
		...REF_PLATFORMS.map((platform) => {
			const refLinkUrl = group.refLinks?.find((refLink) => refLink.platform === platform)?.url ?? "Not set";
			return fmt`${bold(italic(capitalizeFirstLetter(platform)))}: ${code(refLinkUrl)}\n\n`;
		}),
	]);
};
