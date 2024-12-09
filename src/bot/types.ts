import type { DBGroupWithRefLinks, DBUser } from "$/db/schema";
import type { CommandsFlavor } from "@grammyjs/commands";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { Context } from "grammy";

type DatabaseFlavor = {
	dbData: {
		user: DBUser | null;
		group: DBGroupWithRefLinks | null;
	};
};

export type MyContext = ParseModeFlavor<Context & CommandsFlavor & DatabaseFlavor>;
