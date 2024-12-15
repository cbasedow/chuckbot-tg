import type { MyContext } from "$/bot/types";
import { CommandGroup } from "@grammyjs/commands";
import { listenerCommand } from "./listener";
import { refsCommand } from "./refs";

export const adminCommands = new CommandGroup<MyContext>().add([listenerCommand, refsCommand]);
