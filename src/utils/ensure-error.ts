export const ensureError = (error: unknown): Error => {
	if (error instanceof Error) {
		return error;
	}

	if (error && typeof error === "object" && "message" in error) {
		return new Error(String(error.message));
	}

	if (typeof error === "string") {
		return new Error(error);
	}

	return new Error(`Unknown error: ${JSON.stringify(error)}`);
};
