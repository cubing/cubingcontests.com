import "server-only";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable as table,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { getTableColumns } from "drizzle-orm/utils";
import { ContinentIdValues, RecordTypeValues } from "~/helpers/types.ts";
import { tableTimestamps } from "../dbUtils.ts";
import { usersTable } from "./auth-schema.ts";
import type { SelectContest } from "./contests.ts";
import type { SelectEvent } from "./events.ts";
import type { SelectPerson } from "./persons.ts";
import { roundsTable } from "./rounds.ts";

export type Attempt = {
  result: number;
  memo?: number;
};

export const recordTypeEnum = pgEnum("record_type", RecordTypeValues);
export const continentIdEnum = pgEnum("continent_id", ContinentIdValues);

export const resultsTable = table(
  "results",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    eventId: text().notNull(),
    date: timestamp().notNull(),
    approved: boolean().default(false).notNull(),
    personIds: integer().array().notNull(),
    countryIso2: varchar({ length: 2 }), // only set if participants are from the same country
    continentId: continentIdEnum(), // only set if participants are from the same continent
    attempts: jsonb().array().notNull().$type<Attempt[]>(),
    best: bigint({ mode: "number" }).notNull(),
    average: bigint({ mode: "number" }).notNull(),
    regionalSingleRecord: recordTypeEnum(),
    regionalAverageRecord: recordTypeEnum(),
    competitionId: text(), // only used for contest results
    roundId: integer().references(() => roundsTable.id), // only used for contest results
    ranking: integer(), // only used for contest results
    proceeds: boolean(), // only used for contest results
    videoLink: text(), // only used for video-based results
    discussionLink: text(), // only used for video-based results (also optional for those)
    createdBy: text().references(() => usersTable.id, { onDelete: "set null" }),
    createdExternally: boolean().default(false).notNull(),
    ...tableTimestamps,
  },
  (table) => [
    check(
      "results_check",
      sql`(${table.competitionId} is not null
          and ${table.roundId} is not null
          and ${table.ranking} is not null
          and ${table.videoLink} is null
          and ${table.discussionLink} is null)
        or (${table.competitionId} is null
          and ${table.roundId} is null
          and ${table.ranking} is null
          and ${table.proceeds} is null
          and ${table.videoLink} is not null)`,
    ),
  ],
);

export type InsertResult = typeof resultsTable.$inferInsert;
export type SelectResult = typeof resultsTable.$inferSelect;
export type FullResult = SelectResult & {
  event: SelectEvent;
  contest?: SelectContest;
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
