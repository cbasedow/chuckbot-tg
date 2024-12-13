import { type FormattedString, fmt } from "@grammyjs/parse-mode";

/**
 * Formats an array of grammy parse-mode formatted strings into a single formatted string
 * @param - An array of grammy parse-mode formatted strings
 */
export const formatFormattedStrings = (formattedStrings: FormattedString[]) => {
	return formattedStrings.reduce((acc, curr) => fmt`${acc}${curr}`);
};
