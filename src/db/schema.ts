import { relations, sql } from "drizzle-orm";
import { bigint, pgEnum, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

//* Tables
export const users = pgTable(
	"tg_users",
	{
		id: bigint("id", { mode: "number" }).primaryKey(),
		username: varchar("username", { length: 32 }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [uniqueIndex("tg_username_idx").on(t.username).where(sql`username IS NOT NULL`)],
);

export const groups = pgTable("tg_groups", {
	id: bigint("id", { mode: "number" }).primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
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

//* Zod Schemas
export const userSchema = createSelectSchema(users);
export const groupSchema = createSelectSchema(groups);
export const refLinkPlatformSchema = z.enum(refLinkPlatformEnum.enumValues);
export const refLinkSchema = createSelectSchema(refLinks);

export const insertUserSchema = createInsertSchema(users);
export const insertGroupSchema = createInsertSchema(groups);
export const insertRefLinkSchema = createInsertSchema(refLinks);

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
