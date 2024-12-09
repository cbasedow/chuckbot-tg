import { z } from "zod";
import { solanaBase58AddressSchema } from "./solana";

export const birdeyeApiResponseSchema = <T extends z.ZodTypeAny>(responseSchema: T) => {
	return z.object({
		success: z.literal(true),
		data: responseSchema.nullish(),
	});
};

export const tokenCreationInfoSchema = z.object({
	txHash: z.string().min(1),
});

export const tokenCreationInfoResponseSchema = birdeyeApiResponseSchema(tokenCreationInfoSchema);

export const timeIntervalSchema = z.enum([
	"1m",
	"5m",
	"15m",
	"30m",
	"1H",
	"2H",
	"4H",
	"6H",
	"8H",
	"12H",
	"1D",
	"3D",
	"1W",
	"1M",
]);

export const ohlcvPriceSchema = z.object({
	address: solanaBase58AddressSchema,
	c: z.number().min(0),
	h: z.number().min(0),
	l: z.number().min(0),
	o: z.number().min(0),
	type: timeIntervalSchema,
	unixTime: z.number().min(0),
	v: z.number().min(0),
});

export const ohlcvPriceResponseSchema = birdeyeApiResponseSchema(
	z.object({
		items: ohlcvPriceSchema.array(),
	}),
);

export type TokenCreationInfo = z.infer<typeof tokenCreationInfoSchema>;
export type RequestTimeInterval = z.infer<typeof timeIntervalSchema>;
export type OHLCVPrice = z.infer<typeof ohlcvPriceSchema>;
