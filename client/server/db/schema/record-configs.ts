import "server-only";
import { getTableColumns } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable as table, text, varchar } from "drizzle-orm/pg-core";
import { RecordCategoryValues } from "~/helpers/types.ts";
import { tableTimestamps } from "../dbUtils.ts";
import { recordTypeEnum } from "./results.ts";

export const recordCategoryEnum = pgEnum("record_category", RecordCategoryValues);

export const recordConfigsTable = table("record_configs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  recordTypeId: recordTypeEnum().notNull(),
  category: recordCategoryEnum().notNull(),
  label: text().notNull().unique(),
  active: boolean().notNull(),
  rank: integer().notNull(),
  color: varchar({ length: 7 }).notNull(),
  ...tableTimestamps,
});

export type InsertRecordConfig = typeof recordConfigsTable.$inferInsert;
export type SelectRecordConfig = typeof recordConfigsTable.$inferSelect;

const { createdAt: _, updatedAt: _1, ...recordConfigsPublicCols } = getTableColumns(recordConfigsTable);
export { recordConfigsPublicCols };

export type RecordConfigResponse = Pick<SelectRecordConfig, keyof typeof recordConfigsPublicCols>;
