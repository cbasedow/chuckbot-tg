export const constructUrlString = (
	url: string,
	params: Record<string, string | number | boolean>,
	path?: string,
): string => {
	const urlObject = path ? new URL(path, url) : new URL(url);

	for (const [key, value] of Object.entries(params)) {
		urlObject.searchParams.set(key, value.toString());
	}

	return urlObject.toString();
};
