import "server-only";
import { boolean, integer, pgTable as table, text, varchar } from "drizzle-orm/pg-core";
import { tableTimestamps } from "../dbUtils.ts";
import { getTableColumns } from "drizzle-orm";

export const recordConfigsTable = table("record_configs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // @Prop({ enum: WcaRecordType, required: true, immutable: true, unique: true })
  // wcaEquivalent: WcaRecordType;
  recordTypeId: varchar({ length: 4 }).notNull().unique(),
  label: text().notNull().unique(),
  active: boolean().notNull(),
  order: integer().notNull().unique(),
  color: varchar({ length: 7 }).notNull(),
  ...tableTimestamps,
});

export type SelectRecordConfig = typeof recordConfigsTable.$inferSelect;

const {
  createdAt: _,
  updatedAt: _1,
  ...recordConfigsPublicCols
} = getTableColumns(recordConfigsTable);
export { recordConfigsPublicCols };

export type RecordConfigResponse = Pick<SelectRecordConfig, keyof typeof recordConfigsPublicCols>;
