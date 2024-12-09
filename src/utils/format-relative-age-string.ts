const TIME_INTERVALS = [
	{ label: "y", seconds: 31536000 },
	{ label: "mo", seconds: 2592000 },
	{ label: "d", seconds: 86400 },
	{ label: "h", seconds: 3600 },
	{ label: "m", seconds: 60 },
] as const;

export const formatRelativeAge = (timestamp: number): string => {
	const currentTimestampSecs = Math.floor(Date.now() / 1000);
	const ageInSeconds = currentTimestampSecs - timestamp;

	for (const interval of TIME_INTERVALS) {
		const count = ageInSeconds / interval.seconds;
		if (count >= 1) {
			const roundedCount = Math.floor(count);
			return `${roundedCount}${interval.label}`;
		}
	}
	// Round to the nearest second
	return `${Math.floor(ageInSeconds)}s`;
};
