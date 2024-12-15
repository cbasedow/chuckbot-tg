import type { MyContext } from "$/bot/types";
import { CommandGroup } from "@grammyjs/commands";
import { listenerCommand } from "../shared/listener";
import { helpCommand } from "./help";
import { scanCommand } from "./scan";

export const userCommands = new CommandGroup<MyContext>().add([helpCommand, listenerCommand, scanCommand]);
