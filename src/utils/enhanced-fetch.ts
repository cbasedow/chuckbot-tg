import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { logger } from "./logger";

interface FetchOptions extends RequestInit {
	timeout?: number;
	retries?: number;
	retryDelay?: number;
}

const RETRY_STATUS_CODES: Set<number> = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const MAX_RETRY_DELAY = 7500; // 7.5 seconds
const MAX_TIMEOUT = 15000; // 15 seconds

const calculateBackOffDelay = (attempt: number, baseDelay: number): number => {
	return Math.min(baseDelay * 2 ** attempt, MAX_RETRY_DELAY);
};

const shouldRetry = (response: Response, attempt: number, cappedRetries: number): boolean => {
	return attempt < cappedRetries && !response.ok && RETRY_STATUS_CODES.has(response.status);
};

export const enhancedFetch = (url: string, options: FetchOptions = {}): ResultAsync<Response, Error> => {
	const { timeout = MAX_TIMEOUT, retries = MAX_RETRIES, retryDelay = MAX_RETRY_DELAY, ...fetchOptions } = options;

	const cappedRetries = Math.min(retries, MAX_RETRIES);

	const attemptFetch = (attempt: number): ResultAsync<Response, Error> => {
		const signal = AbortSignal.timeout(timeout);

		return ResultAsync.fromPromise(fetch(url, { ...fetchOptions, signal }), (error) => {
			if (error instanceof Error) {
				if (error.name === "AbortError") {
					return new Error(`Request timed out after ${timeout}ms`);
				}
				return new Error(`Network error: ${error.message}`);
			}
			return new Error(`Unknown fetch error: ${error}`);
		}).andThen((response) => {
			if (shouldRetry(response, attempt, cappedRetries)) {
				logger.debug(`Retrying request to ${url} ${attempt + 1}/${cappedRetries}`);
				const retryAfter = response.headers.get("Retry-After");
				const baseDelay = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : retryDelay;
				const backoffDelay = calculateBackOffDelay(attempt, baseDelay);

				return ResultAsync.fromPromise(new Promise((resolve) => setTimeout(resolve, backoffDelay)), () => {
					return new Error("Retry delay failed unexpectedly");
				}).andThen(() => attemptFetch(attempt + 1));
			}

			if (!response.ok) {
				return errAsync(new Error(`HTTP error: ${response.status} ${response.statusText}`));
			}

			return okAsync(response);
		});
	};

	return attemptFetch(0);
};
