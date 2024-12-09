import { drizzle } from "drizzle-orm/postgres-js";
import { envConfig } from "env";
import postgres from "postgres";

import * as schema from "./schema";

const client = postgres(envConfig.DATABASE_URL, {
	max: 15,
	idle_timeout: 30, // seconds
});

export const db = drizzle({ client, schema });
