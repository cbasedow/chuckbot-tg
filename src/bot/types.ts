import type { DBGroupWithRefLinks, DBUser } from "$/db/schema";
import type { CommandsFlavor } from "@grammyjs/commands";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { Context } from "grammy";

type DatabaseFlavor = {
	dbData: {
		user: DBUser | null;
		group: DBGroupWithRefLinks | null;
	};
};

export type MyContext = ConversationFlavor<ParseModeFlavor<Context & CommandsFlavor & DatabaseFlavor>>;
// My conversation context must not have ConversationFlavor
export type MyConversationContext = ParseModeFlavor<Context & DatabaseFlavor>;
export type MyConversation = Conversation<MyContext, MyConversationContext>;
