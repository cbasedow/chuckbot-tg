export const constructUrlString = (
	url: string,
	path: string,
	params: Record<string, string | number | boolean>,
): string => {
	const urlObject = new URL(path, url);

	for (const [key, value] of Object.entries(params)) {
		urlObject.searchParams.set(key, value.toString());
	}

	return urlObject.toString();
};
