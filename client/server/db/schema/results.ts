import "server-only";
import { bigint, boolean, integer, jsonb, pgEnum, pgTable as table, text, timestamp } from "drizzle-orm/pg-core";
import { tableTimestamps } from "../dbUtils.ts";
import { getTableColumns } from "drizzle-orm/utils";
import { usersTable } from "./auth-schema.ts";
import { RecordTypeValues } from "~/helpers/types.ts";
import { SelectEvent } from "./events.ts";
import { SelectPerson } from "./persons.ts";

export type Attempt = {
  result: number;
  memo?: number;
};

export const recordTypeEnum = pgEnum("record_type", RecordTypeValues);

export const resultsTable = table("results", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: text().notNull(),
  date: timestamp().notNull(),
  approved: boolean().default(false).notNull(),
  personIds: integer().array().notNull(),
  attempts: jsonb().array().notNull().$type<Attempt[]>(),
  best: bigint({ mode: "number" }).notNull(),
  average: bigint({ mode: "number" }).notNull(),
  singleRecordTypes: recordTypeEnum().array(),
  averageRecordTypes: recordTypeEnum().array(),
  competitionId: text(), // only used for contest results
  ranking: integer(), // only used for contest results
  proceeds: boolean(), // only used for contest results
  videoLink: text(), // only used for video-based results
  discussionLink: text(), // only used for video-based results
  createdBy: text().references(() => usersTable.id, { onDelete: "set null" }),
  createdExternally: boolean().default(false).notNull(),
  ...tableTimestamps,
});

export type InsertResult = typeof resultsTable.$inferInsert;
export type SelectResult = typeof resultsTable.$inferSelect;
export type FullResult = SelectResult & {
  event: SelectEvent;
  // contest: ??
  persons: SelectPerson[];
};

const {
  createdBy: _,
  createdExternally: _1,
  createdAt: _2,
  updatedAt: _3,
  ...resultsPublicCols
} = getTableColumns(resultsTable);
export { resultsPublicCols };

export type ResultResponse = Pick<SelectResult, keyof typeof resultsPublicCols>;
