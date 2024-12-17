import type { DBRefLinkPlatform, DBRefLinkWithUser } from "$/db/schema";
import { capitalizeFirstLetter } from "$/utils/capitalize-first-letter";
import { formatRelativeAge } from "$/utils/format-relative-age-string";
import { Menu } from "@grammyjs/menu";
import { type FormattedString, bold, code, fmt, italic } from "@grammyjs/parse-mode";
import { formatRefLinksMessage } from "../commands/admin/refs";
import { EMOJIS, REF_PLATFORMS } from "../constants";
import type { MyContext } from "../types";
import { formatFormattedStrings } from "../utils/format-formatted-strings";

const MAX_PLATFORMS_PER_ROW = 3;

export const manageRefLinksMenu = new Menu<MyContext>("manage-ref-links-menu").submenu(
	`${EMOJIS.GEAR} Manage Ref Links`,
	"ref-link-platforms-menu",
);

export const refLinkPlatformsMenu = new Menu<MyContext>("ref-link-platforms-menu", { autoAnswer: false })
	.text(`Select platform to manage ${EMOJIS.POINT_DOWN}`)
	.dynamic((_, range) => {
		for (let i = 0; i < REF_PLATFORMS.length; i++) {
			const selectedPlatform = REF_PLATFORMS[i];
			const selectedPlatformLabel = capitalizeFirstLetter(selectedPlatform) as Capitalize<DBRefLinkPlatform>;

			// Add a row if we've reached the max platforms per row
			if (i % MAX_PLATFORMS_PER_ROW === 0) {
				range.row();
			}

			range.text(selectedPlatformLabel, async (ctx) => {
				const dbData = ctx.dbData;
				if (!(dbData.group && dbData.user)) {
					return await ctx.replyFmt("An error occured getting group and user data. Please try again later");
				}

				if (ctx.from.id === dbData.user.id) {
					await ctx.answerCallbackQuery();

					const currRefLink = dbData.group.refLinks?.find((refLink) => refLink.platform === selectedPlatform) ?? null;

					const currRefLinkDetailsMenu = createCurrRefLinkDetailsMenu(selectedPlatform);

					// Format the current ref link details into parse-mode formatted string
					const formattedCurrRefLinkDetails = formatCurrRefLinkDetails(currRefLink, selectedPlatformLabel);

					await ctx.editFmtMessageText(formattedCurrRefLinkDetails, {
						reply_markup: currRefLinkDetailsMenu,
					});
				} else {
					await ctx.answerCallbackQuery({
						text: `Only user ${dbData.user.username ?? dbData.user.id} can currently select the ${selectedPlatformLabel} ref to manage`,
						show_alert: true,
					});
				}
			});
		}
	})
	.row()
	.back(`${EMOJIS.ARROW_LEFT} Back`);

export const createCurrRefLinkDetailsMenu = (selectedPlatform: DBRefLinkPlatform) => {
	return new Menu<MyContext>(`curr-${selectedPlatform}-ref-link-details-menu`, {
		autoAnswer: false,
	}).dynamic((ctx, range) => {
		const dbData = ctx.dbData;
		if (!(dbData.group && dbData.user)) {
			return;
		}

		const { user, group } = dbData;

		const currRefLink = group.refLinks?.find((refLink) => refLink.platform === selectedPlatform) ?? null;

		const selectedPlatformLabel = capitalizeFirstLetter(selectedPlatform) as Capitalize<DBRefLinkPlatform>;

		// Only show the delete option if the current ref link is set
		if (currRefLink) {
			range.text(`${EMOJIS.RED_X} Delete`, async (ctx) => {
				if (ctx.from.id === user.id) {
					await ctx.answerCallbackQuery();
					await ctx.menu.close({ immediate: true });

					await ctx.conversation.enter("manage-ref", {
						selectedPlatform,
						selectedPlatformLabel,
						action: "delete",
					});
				} else {
					await ctx.answerCallbackQuery({
						text: `Only user ${user.username ?? user.id} can currently delete the ${selectedPlatformLabel} ref link`,
						show_alert: true,
					});
				}
			});

			range.text(`${EMOJIS.PENCIL} Set`, async (ctx) => {
				if (ctx.from.id === user.id) {
					await ctx.answerCallbackQuery();
					await ctx.menu.close({ immediate: true });

					await ctx.conversation.enter("manage-ref", {
						selectedPlatform,
						selectedPlatformLabel,
						action: "set",
					});
				}
			});

			range.row().text(`${EMOJIS.ARROW_LEFT} Back`, async (ctx) => {
				await ctx.editFmtMessageText(formatRefLinksMessage(group), {
					reply_markup: refLinkPlatformsMenu,
				});
			});
		} else {
			range.text(`${EMOJIS.ARROW_LEFT} Back`, async (ctx) => {
				await ctx.editFmtMessageText(formatRefLinksMessage(group), {
					reply_markup: refLinkPlatformsMenu,
				});
			});

			range.text(`${EMOJIS.PENCIL} Set`, async (ctx) => {
				if (ctx.from.id === user.id) {
					await ctx.answerCallbackQuery();
					await ctx.menu.close({ immediate: true });

					await ctx.conversation.enter("manage-ref", {
						selectedPlatform,
						selectedPlatformLabel,
						action: "set",
					});
				}
			});
		}
	});
};

const formatCurrRefLinkDetails = (
	currRefLink: DBRefLinkWithUser | null,
	selectedPlatformLabel: Capitalize<DBRefLinkPlatform>,
): FormattedString => {
	const detailsLines: FormattedString[] = [
		fmt`${EMOJIS.LINK} ${bold(`Current ${selectedPlatformLabel} ref link details`)}\n\n`,
		fmt`${bold(italic("URL:"))} ${code(currRefLink?.url ?? "Not set")}\n\n`,
	];

	if (currRefLink) {
		const { createdAt, createdBy, updatedAt, updatedBy } = currRefLink;

		const createdAtRelativeTime = formatRelativeAge(new Date(createdAt).getTime() / 1000);
		const updatedAtRelativeTime = formatRelativeAge(new Date(updatedAt).getTime() / 1000);

		detailsLines.push(
			fmt`${bold(italic("Created By:"))} ${code(`${createdBy.username ?? createdBy.id} [${createdAtRelativeTime} ago]`)}\n\n`,
			fmt`${bold(italic("Updated By:"))} ${code(`${updatedBy.username ?? updatedBy.id} [${updatedAtRelativeTime} ago]`)}\n\n`,
			fmt`${bold(`Would you like to delete or set your ${selectedPlatformLabel} ref link? ${EMOJIS.POINT_DOWN}`)}`,
		);
	} else {
		detailsLines.push(
			fmt`${bold(`Would you like to set your ${selectedPlatformLabel} ref link? ${EMOJIS.POINT_DOWN}`)}`,
		);
	}

	return formatFormattedStrings(detailsLines);
};
