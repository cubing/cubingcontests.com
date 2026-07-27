import "server-only";
import { getColumns } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { RecordCategoryValues } from "~/helpers/types.ts";
import { organizationsTable } from "~/server/db/schema/auth-schema.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";
import { tableTimestamps } from "../db-utils.ts";

export const recordCategoryEnum = rrSchema.enum("record_category", RecordCategoryValues);

export const recordConfigsTable = rrSchema.table(
  "record_configs",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    recordTypeId: d.text().notNull(),
    category: recordCategoryEnum().notNull(),
    label: d.text().notNull(),
    active: d.boolean().default(true).notNull(),
    rank: d.integer().notNull(),
    color: d.varchar({ length: 7 }).notNull(),
    ...tableTimestamps,
  },
  (table) => [d.unique("unique_record_configs").on(table.organizationId, table.recordTypeId, table.category)],
);

export type InsertRecordConfig = typeof recordConfigsTable.$inferInsert;
export type SelectRecordConfig = typeof recordConfigsTable.$inferSelect;

const { organizationId: _, createdAt: _1, updatedAt: _2, ...recordConfigsPublicCols } = getColumns(recordConfigsTable);

export { recordConfigsPublicCols };

export type RecordConfigResponse = Pick<SelectRecordConfig, keyof typeof recordConfigsPublicCols>;
