import "server-only";
import { bigint, boolean, integer, jsonb, pgEnum, pgTable as table, text, timestamp } from "drizzle-orm/pg-core";
import { tableTimestamps } from "../dbUtils.ts";
import { getTableColumns } from "drizzle-orm/utils";
import { usersTable } from "./auth-schema.ts";
import { RecordTypeValues } from "~/helpers/types.ts";

export type Attempt = {
  result: number;
  memo?: number;
};

export const recordTypeEnum = pgEnum("record_type", RecordTypeValues);

export const resultsTable = table("results", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: text().notNull(),
  date: timestamp().notNull(),
  approved: boolean().notNull(),
  personIds: integer().array().notNull(),
  attempts: jsonb().$type<Attempt>().array().notNull(),
  best: bigint({ mode: "number" }).notNull(),
  average: bigint({ mode: "number" }).notNull(),
  singleRecordTypes: recordTypeEnum().array(),
  averageRecordTypes: recordTypeEnum().array(),
  competitionId: text(), // only used for contest results
  ranking: integer(), // only used for contest results
  proceeds: boolean(), // only used for contest results
  videoLink: text(),
  discussionLink: text(),
  createdBy: text().references(() => usersTable.id, { onDelete: "set null" }),
  createdExternally: boolean(),
  ...tableTimestamps,
});

export type SelectResult = (Omit<typeof resultsTable.$inferSelect, "attempts">) & {
  attempts: Attempt[];
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
