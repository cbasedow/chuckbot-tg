import type { MyContext } from "$/bot/types";
import { CommandGroup } from "@grammyjs/commands";
import { listenerCommand } from "../shared/listener";
import { refsCommand } from "./refs";

export const adminCommands = new CommandGroup<MyContext>().add([
	refsCommand,
	listenerCommand.addToScope({
		type: "all_chat_administrators",
	}),
]);
