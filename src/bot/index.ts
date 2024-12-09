import { logger } from "$/utils/logger";
import { envConfig } from "env";
import { Bot, GrammyError, HttpError, webhookCallback } from "grammy";
import { Hono } from "hono";

const bot = new Bot(envConfig.BOT_TOKEN);
const app = new Hono();

app.get("/", (c) => {
	return c.json({ message: "Hello from Chuckbot!" });
});

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
