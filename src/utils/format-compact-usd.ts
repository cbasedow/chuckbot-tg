const compactUsdFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	notation: "compact",
	compactDisplay: "short",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
	roundingMode: "halfCeil",
});

export const formatCompactUsd = (value: number): string => {
	if (value <= 0) {
		return "$0.00";
	}

	return compactUsdFormatter.format(value);
};
