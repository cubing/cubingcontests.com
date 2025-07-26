import "server-only";
import { bigint, boolean, integer, jsonb, pgTable as table, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { tableTimestamps } from "../dbUtils.ts";
import { getTableColumns } from "drizzle-orm/utils";
import { usersTable } from "./auth-schema.ts";

export const resultsTable = table("results", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: text().notNull(),
  date: timestamp().notNull(),
  approved: boolean().notNull(),
  personIds: integer().array().notNull(),
  attempts: jsonb().$type<{
    result: number;
    memo?: number;
  }>().array().notNull(),
  best: bigint({ mode: "number" }).notNull(),
  average: bigint({ mode: "number" }).notNull(),
  regionalSingleRecord: varchar({ length: 2 }),
  regionalAverageRecord: varchar({ length: 2 }),
  competitionId: text(), // only used for contest results
  ranking: integer(), // only used for contest results
  proceeds: boolean(), // only used for contest results
  videoLink: text(),
  discussionLink: text(),
  createdBy: text().references(() => usersTable.id, { onDelete: "set null" }), // this can be null if the user has been deleted
  ...tableTimestamps,
});

export type SelectResult = typeof resultsTable.$inferSelect;

const {
  createdBy: _,
  createdAt: _1,
  updatedAt: _2,
  ...resultsPublicCols
} = getTableColumns(resultsTable);
export { resultsPublicCols };

export type ResultResponse = Pick<SelectResult, keyof typeof resultsPublicCols>;
