import type { MyContext } from "$/bot/types";
import { CommandGroup } from "@grammyjs/commands";
import { scanCommand } from "./scan";

export const userCommands = new CommandGroup<MyContext>().add([scanCommand]);
