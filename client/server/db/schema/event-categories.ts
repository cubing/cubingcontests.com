import "server-only";
import { getColumns } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { tableTimestamps } from "~/server/db/db-utils.ts";
import { organizationsTable } from "~/server/db/schema/auth-schema.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";

export const eventCategoriesTable = rrSchema.table(
  "event_categories",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: d.text().notNull(),
    rank: d.integer().notNull(),
    name: d.text().notNull(),
    shortName: d.text(),
    description: d.text(),
    color: d.varchar({ length: 7 }).notNull(),
    hidden: d.boolean().default(false).notNull(),
    videoBased: d.boolean().default(false).notNull(),
    ...tableTimestamps,
  },
  (table) => [d.unique("unique_event_categories_category_id").on(table.organizationId, table.categoryId)],
);

export type InsertEventCategory = typeof eventCategoriesTable.$inferInsert;
export type SelectEventCategory = typeof eventCategoriesTable.$inferSelect;

const {
  organizationId: _,
  createdAt: _1,
  updatedAt: _2,
  ...eventCategoriesPublicCols
} = getColumns(eventCategoriesTable);

export { eventCategoriesPublicCols };

export type EventCategoryResponse = Pick<SelectEventCategory, keyof typeof eventCategoriesPublicCols>;
