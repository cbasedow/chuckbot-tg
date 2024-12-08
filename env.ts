import { ZodError, z } from "zod";

export const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production"]).default("development"),
	BIRDEYE_API_KEY: z.string().min(1),
	//! TODO: Add more env variables here
});

type EnvConfig = z.infer<typeof envSchema>;

const validateEnvConfig = (): EnvConfig => {
	try {
		return envSchema.parse(process.env);
	} catch (error) {
		if (error instanceof ZodError) {
			const errorMessage = Object.entries(error.flatten().fieldErrors)
				.map(([field, errors]) => {
					return `${field}: ${errors?.join(", ")}`;
				})
				.join("\n");
			throw new Error(`Invalid environment variables:\n${errorMessage}`);
		}
		throw error;
	}
};

export const envConfig = validateEnvConfig();
