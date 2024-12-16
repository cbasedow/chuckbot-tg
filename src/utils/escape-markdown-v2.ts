export const escapeMarkdownV2 = (text: string): string => {
	// These characters must be escaped in MarkdownV2
	return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
};
