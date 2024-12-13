import type { DBRefLinkPlatform } from "$/db/schema";

export const EMOJIS = {
	ARROW_LEFT: "⬅️",
	ARROW_RIGHT: "➡️",
	ARROW_UP: "⬆️",
	ARROW_DOWN: "⬇️",
	BULB: "💡",
	GEAR: "⚙️",
	RED_X: "❌",
	GREEN_CHECK: "✅",
	RED_QUESTION: "❓",
	PENCIL: "✏️",
	LINK: "🔗",
	POINT_DOWN: "👇",
	STOP_SIGN: "🛑",
};

export const REF_PLATFORMS: DBRefLinkPlatform[] = ["bonk", "bullx", "maestro", "photon", "shuriken", "trojan"];
