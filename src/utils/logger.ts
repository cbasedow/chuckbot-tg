import { envConfig } from "env";
import { pino } from "pino";

export const logger = pino({
	// Debug in development, info in production
	level: envConfig.NODE_ENV === "development" ? "debug" : "info",
	serializers: {
		err: pino.stdSerializers.err,
		req: pino.stdSerializers.req,
		res: pino.stdSerializers.res,
	},
	timestamp: pino.stdTimeFunctions.isoTime,
	redact: {
		paths: ["req.headers.authorization", "req.headers.cookie"],
		censor: "**REDACTED**",
	},
	transport:
		// Only pino-pretty in development
		envConfig.NODE_ENV === "development"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						ignore: "pid,hostname",
						translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
					},
				}
			: undefined,
});
