import { relations, sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	integer,
	pgEnum,
	pgTable,
	serial,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

//* Tables
export const users = pgTable(
	"tg_users",
	{
		id: bigint("id", { mode: "number" }).primaryKey(),
		username: varchar("username", { length: 32 }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		addressListenerEnabled: boolean("address_listener_enabled").notNull().default(false),
		tokenScanCount: integer("token_scan_count").notNull().default(0),
	},
	(t) => [uniqueIndex("tg_username_idx").on(t.username).where(sql`username IS NOT NULL`)],
);

export const groups = pgTable("tg_groups", {
	id: bigint("id", { mode: "number" }).primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	addressListenerEnabled: boolean("address_listener_enabled").notNull().default(false),
	tokenScanCount: integer("token_scan_count").notNull().default(0),
});

export const refLinkPlatformEnum = pgEnum("ref_link_platform", [
	"bonk",
	"bullx",
	"maestro",
	"photon",
	"shuriken",
	"trojan",
]);

export const refLinks = pgTable(
	"tg_group_ref_links",
	{
		id: serial("id").primaryKey(),
		groupId: bigint("group_id", { mode: "number" })
			.references(() => groups.id, { onDelete: "cascade" })
			.notNull(),
		platform: refLinkPlatformEnum("platform").notNull(),
		url: varchar("url", { length: 255 }).notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: bigint("created_by", { mode: "number" })
			.references(() => users.id)
			.notNull(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		updatedBy: bigint("updated_by", { mode: "number" })
			.references(() => users.id)
			.notNull(),
	},
	(t) => [
		uniqueIndex("tg_group_ref_platform_idx").on(t.platform, t.groupId),
		uniqueIndex("tg_group_ref_url_idx").on(t.url, t.groupId),
	],
);

export const splTokens = pgTable(
	"spl_tokens",
	{
		address: varchar("address", { length: 44 }).primaryKey(),
		poolAddress: varchar("pool_address", { length: 44 }),
		scanCount: integer("scan_count").notNull().default(0),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [uniqueIndex("pool_address_idx").on(t.poolAddress)],
);

export const splTokenSourceEnum = pgEnum("spl_token_sources", ["MOONSHOT", "PUMPFUN", "DEFAULT"]);

export const tokenMintInfo = pgTable(
	"spl_token_mint_info",
	{
		mintSource: splTokenSourceEnum("mint_source").notNull(),
		mintedAtUnix: bigint("minted_at_unix", { mode: "number" }).notNull(),
		devAddress: varchar("dev_address", { length: 44 }).notNull(),
		bondingCurveAddress: varchar("bonding_curve_address", { length: 44 }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		tokenAddress: varchar("token_address", { length: 44 })
			.references(() => splTokens.address, { onDelete: "cascade" })
			.notNull(),
	},
	(t) => [uniqueIndex("mint_info_address_idx").on(t.tokenAddress)],
);

export const allTimeHighPriceInfo = pgTable(
	"spl_ath_info",
	{
		id: serial("id").primaryKey(),
		priceUsd: varchar("price_usd", { length: 30 }).notNull(),
		reachedAtUnix: bigint("reached_at_unix", { mode: "number" }).notNull(),
		lastQueryTimeToUnix: bigint("last_query_time_to_unix", { mode: "number" }).notNull(),
		tokenAddress: varchar("token_address", { length: 44 })
			.references(() => splTokens.address, { onDelete: "cascade" })
			.notNull(),
	},
	(t) => [uniqueIndex("spl_ath_info_token_address_idx").on(t.tokenAddress)],
);

//* Relations
export const usersRelations = relations(users, ({ many }) => {
	return {
		createdRefLinks: many(refLinks, { relationName: "createdRefLinks" }),
		updatedRefLinks: many(refLinks, { relationName: "updatedRefLinks" }),
	};
});

export const groupsRelations = relations(groups, ({ many }) => {
	return {
		refLinks: many(refLinks),
	};
});

export const refLinksRelations = relations(refLinks, ({ one }) => {
	return {
		group: one(groups, {
			fields: [refLinks.groupId],
			references: [groups.id],
		}),
		createdBy: one(users, {
			fields: [refLinks.createdBy],
			references: [users.id],
			relationName: "createdRefLinks",
		}),
		updatedBy: one(users, {
			fields: [refLinks.updatedBy],
			references: [users.id],
			relationName: "updatedRefLinks",
		}),
	};
});

export const splTokensRelations = relations(splTokens, ({ one }) => {
	return {
		mintInfo: one(tokenMintInfo, {
			fields: [splTokens.address],
			references: [tokenMintInfo.tokenAddress],
		}),
		athPriceInfo: one(allTimeHighPriceInfo, {
			fields: [splTokens.address],
			references: [allTimeHighPriceInfo.tokenAddress],
		}),
	};
});

export const tokenMintInfoRelations = relations(tokenMintInfo, ({ one }) => {
	return {
		token: one(splTokens, {
			fields: [tokenMintInfo.tokenAddress],
			references: [splTokens.address],
		}),
	};
});

export const allTimeHighPriceInfoRelations = relations(allTimeHighPriceInfo, ({ one }) => {
	return {
		token: one(splTokens, {
			fields: [allTimeHighPriceInfo.tokenAddress],
			references: [splTokens.address],
		}),
	};
});

//* Zod Schemas
export const userSchema = createSelectSchema(users);
export const groupSchema = createSelectSchema(groups);
export const refLinkPlatformSchema = z.enum(refLinkPlatformEnum.enumValues);
export const refLinkSchema = createSelectSchema(refLinks);
export const splTokenSchema = createSelectSchema(splTokens);
export const tokenMintInfoSchema = createSelectSchema(tokenMintInfo);
export const allTimeHighPriceInfoSchema = createSelectSchema(allTimeHighPriceInfo);

export const insertUserSchema = createInsertSchema(users);
export const insertGroupSchema = createInsertSchema(groups);
export const insertRefLinkSchema = createInsertSchema(refLinks);
export const insertSplTokenSchema = createInsertSchema(splTokens);
export const insertTokenMintInfoSchema = createInsertSchema(tokenMintInfo);
export const insertAllTimeHighPriceInfoSchema = createInsertSchema(allTimeHighPriceInfo);
export const insertFullSplTokenSchema = insertSplTokenSchema.extend({
	mintInfo: insertTokenMintInfoSchema.nullable(),
	athPriceInfo: insertAllTimeHighPriceInfoSchema.nullable(),
});

//* Types
export type DBUser = z.infer<typeof userSchema>;
export type NewDBUser = z.infer<typeof insertUserSchema>;
export type DBGroup = z.infer<typeof groupSchema>;
export type DBGroupWithRefLinks = DBGroup & {
	refLinks: DBRefLinkWithUser[] | null;
};
export type NewDBGroup = z.infer<typeof insertGroupSchema>;
export type DBRefLinkPlatform = z.infer<typeof refLinkPlatformSchema>;
export type DBRefLink = z.infer<typeof refLinkSchema>;
export type NewDBRefLink = z.infer<typeof insertRefLinkSchema>;
export type DBRefLinkWithUser = DBRefLink & {
	createdBy: DBUser;
	updatedBy: DBUser;
};
export type DBSplToken = z.infer<typeof splTokenSchema>;
export type NewDBSplToken = z.infer<typeof insertSplTokenSchema>;
export type DBTokenMintInfo = z.infer<typeof tokenMintInfoSchema>;
export type NewDBTokenMintInfo = z.infer<typeof insertTokenMintInfoSchema>;
export type DBAllTimeHighPriceInfo = z.infer<typeof allTimeHighPriceInfoSchema>;
export type NewDBAthPriceInfo = z.infer<typeof insertAllTimeHighPriceInfoSchema>;
export type NewDBFullSplToken = z.infer<typeof insertFullSplTokenSchema>;
export type DBFullSplToken = DBSplToken & {
	mintInfo: DBTokenMintInfo | null;
	athPriceInfo: DBAllTimeHighPriceInfo | null;
};
