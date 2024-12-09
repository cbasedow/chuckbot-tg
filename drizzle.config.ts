import { defineConfig } from "drizzle-kit";
import { envConfig } from "env";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: envConfig.DATABASE_URL,
	},
	strict: true,
	verbose: true,
});
