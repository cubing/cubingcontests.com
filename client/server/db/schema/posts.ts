import "server-only";
import { getColumns } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { tableTimestamps } from "~/server/db/db-utils.ts";
import { organizationsTable, usersTable } from "~/server/db/schema/auth-schema.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";

export const postsTable = rrSchema.table(
  "posts",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    postId: d.text().notNull(),
    title: d.text().notNull(),
    content: d.text().notNull(),
    date: d.timestamp().defaultNow().notNull(),
    createdBy: d.text().references(() => usersTable.id, { onDelete: "set null" }),
    ...tableTimestamps,
  },
  (table) => [d.unique("unique_posts_post_id").on(table.organizationId, table.postId)],
);

export type InsertPost = typeof postsTable.$inferInsert;
export type SelectPost = typeof postsTable.$inferSelect;

const { organizationId: _, createdBy: _1, createdAt: _2, updatedAt: _3, ...postsPublicCols } = getColumns(postsTable);

export { postsPublicCols };

export type PostResponse = Pick<SelectPost, keyof typeof postsPublicCols>;
