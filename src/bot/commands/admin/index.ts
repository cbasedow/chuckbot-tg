import type { MyContext } from "$/bot/types";
import { CommandGroup } from "@grammyjs/commands";
import { refsCommand } from "./refs";

export const adminCommands = new CommandGroup<MyContext>().add([refsCommand]);
