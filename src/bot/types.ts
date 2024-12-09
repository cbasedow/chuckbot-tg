import type { CommandsFlavor } from "@grammyjs/commands";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { Context } from "grammy";

export type MyContext = ParseModeFlavor<Context & CommandsFlavor>;
