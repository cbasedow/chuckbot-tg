const tokenPriceFormatter = (sigDigits: number, isUsd: boolean): Intl.NumberFormat => {
	return new Intl.NumberFormat("en-US", {
		style: isUsd ? "currency" : "decimal",
		currency: isUsd ? "USD" : undefined,
		minimumFractionDigits: sigDigits,
		maximumFractionDigits: sigDigits,
		useGrouping: false,
	});
};

export const formatTokenPrice = (price: number, isUsd: boolean): string => {
	const abs = Math.abs(price);
	let sigDigits: number;

	if (abs >= 1) {
		sigDigits = 2;
	} else {
		const leadingZeros = Math.floor(Math.log10(1 / abs));
		sigDigits = leadingZeros + 4;
	}

	return tokenPriceFormatter(sigDigits, isUsd).format(price);
};
