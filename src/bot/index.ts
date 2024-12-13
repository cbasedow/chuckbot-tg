import type { DBRefLinkPlatform } from "$/db/schema";
import { logger } from "$/utils/logger";
import { autoRetry } from "@grammyjs/auto-retry";
import { commands } from "@grammyjs/commands";
import { conversations, createConversation } from "@grammyjs/conversations";
import { hydrateReply } from "@grammyjs/parse-mode";
import { envConfig } from "env";
import { Bot, GrammyError, HttpError, webhookCallback } from "grammy";
import { Hono } from "hono";
import { adminCommands } from "./commands/admin";
import { REF_PLATFORMS } from "./constants";
import { manageRef } from "./conversations/manage-ref";
import { createCurrRefLinkDetailsMenu, manageRefLinksMenu, refLinkPlatformsMenu } from "./menus/manage-ref-links";
import { ensureDBData } from "./middleware/ensure-db-data";
import type { MyContext } from "./types";

const bot = new Bot<MyContext>(envConfig.BOT_TOKEN);
const app = new Hono();

app.get("/", (c) => {
	return c.json({ message: "Hello from Chuckbot!" });
});

// Middlewares
bot.use(hydrateReply);
bot.use(commands());
bot.use(conversations({ plugins: [hydrateReply] }));
bot.use(ensureDBData);

// Transformers
bot.api.config.use(
	autoRetry({
		maxRetryAttempts: 1, // Retry only once
		maxDelaySeconds: 5, // Max delay of 5 seconds
	}),
);

// Conversations
bot.use(createConversation(manageRef, "manage-ref"));

// Menus
for (const platform of REF_PLATFORMS) {
	refLinkPlatformsMenu.register(createCurrRefLinkDetailsMenu(platform));
}
manageRefLinksMenu.register(refLinkPlatformsMenu);
bot.use(manageRefLinksMenu);

// Commands
bot.use(adminCommands);

// Long polling in development
if (envConfig.NODE_ENV === "development") {
	bot.start({
		onStart: (botInfo) => {
			logger.info(`Bot started as @${botInfo.username}`);
		},
		drop_pending_updates: true,
		allowed_updates: ["chat_member", "message", "my_chat_member", "callback_query"],
	});
} else {
	// Webhook in production
	app.post("/webhook", async (c) => {
		try {
			return await webhookCallback(bot, "hono")(c);
		} catch (error) {
			logger.error(`Telegram Webhook Error: ${error}`);
			return c.json({ error: "Internal Server Error" }, 500);
		}
	});
}

bot.catch((err) => {
	const error = err.error;

	if (error instanceof GrammyError) {
		logger.error(`GrammyError: ${error.description}`);
	} else if (error instanceof HttpError) {
		logger.error(`HttpError connecting to Telegram API: ${error}`);
	} else {
		logger.error(`An unknow Telegram Bot error occured: ${error}`);
	}
});

export default app;
