import type { MyContext } from "$/bot/types";
import { CommandGroup } from "@grammyjs/commands";
import { listenerCommand } from "../shared/listener";
import { feedbackCommand } from "./feedback";
import { helpCommand } from "./help";
import { scanCommand } from "./scan";
import { startCommand } from "./start";

export const userCommands = new CommandGroup<MyContext>().add([
	feedbackCommand,
	helpCommand,
	listenerCommand,
	scanCommand,
	startCommand,
]);
