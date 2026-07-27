import "server-only";
import { sql } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { getColumns } from "drizzle-orm/utils";
import { recordCategoryEnum } from "~/server/db/schema/record-configs.ts";
import { regionsTable } from "~/server/db/schema/regions.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";
import { tableTimestamps } from "../db-utils.ts";
import { organizationsTable, usersTable } from "./auth-schema.ts";
import { contestsTable, type SelectContest } from "./contests.ts";
import { eventsTable } from "./events.ts";
import type { SelectPerson } from "./persons.ts";
import { roundsTable } from "./rounds.ts";

export type Attempt = {
  // The result format is described in the exports README
  result: number;
  memo?: number;
};

export const resultsTable = rrSchema.table(
  "results",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    eventId: d.text().notNull(),
    date: d.timestamp().notNull(),
    approved: d.boolean().default(false).notNull(),
    personIds: d.integer().array().notNull(),
    // These two are only set if participants are from the same region/super-region
    regionCode: d.text(),
    superRegionCode: d.text(),
    attempts: d.jsonb().$type<Attempt>().array().notNull(),
    best: d.bigint({ mode: "number" }).notNull(),
    average: d.bigint({ mode: "number" }).notNull(),
    recordCategory: recordCategoryEnum().notNull(),
    regionalSingleRecord: d.text(),
    regionalAverageRecord: d.text(),
    competitionId: d.text(), // only used for contest results
    roundId: d.integer().references(() => roundsTable.id), // only used for contest results
    ranking: d.integer(), // only used for contest results
    proceeds: d.boolean(), // only used for contest results from non-final rounds
    videoLink: d.text(), // only used for video-based results
    discussionLink: d.text(), // only used for video-based results (also optional for those)
    // Before v0.13, createdExternally wasn't a column, and createdBy was only set for video-based results
    createdBy: d.text().references(() => usersTable.id, { onDelete: "set null" }),
    createdExternally: d.boolean().default(false).notNull(),
    ...tableTimestamps,
  },
  (table) => [
    d
      .foreignKey({
        columns: [table.organizationId, table.eventId],
        foreignColumns: [eventsTable.organizationId, eventsTable.eventId],
        name: "results_event_id_fk",
      })
      .onUpdate("cascade"),
    d
      .foreignKey({
        columns: [table.organizationId, table.regionCode],
        foreignColumns: [regionsTable.organizationId, regionsTable.code],
        name: "results_region_code_fk",
      })
      .onUpdate("cascade"),
    d
      .foreignKey({
        columns: [table.organizationId, table.superRegionCode],
        foreignColumns: [regionsTable.organizationId, regionsTable.code], // yes, this also refers to regions.code
        name: "results_super_region_code_fk",
      })
      .onUpdate("cascade"),
    d
      .foreignKey({
        columns: [table.organizationId, table.competitionId],
        foreignColumns: [contestsTable.organizationId, contestsTable.competitionId],
        name: "results_competition_id_fk",
      })
      .onUpdate("cascade"),
    d.check(
      "results_check",
      sql`(${table.competitionId} IS NOT NULL
          AND ${table.recordCategory} <> 'online'
          AND ${table.roundId} IS NOT NULL
          AND ${table.ranking} IS NOT NULL)
        OR (${table.competitionId} IS NULL
          AND ${table.recordCategory} = 'online'
          AND ${table.roundId} IS NULL
          AND ${table.ranking} IS NULL
          AND ${table.proceeds} IS NULL)`,
    ),
  ],
);

export type InsertResult = typeof resultsTable.$inferInsert;
export type SelectResult = typeof resultsTable.$inferSelect;

export type FullResult = SelectResult & {
  contest?: SelectContest;
  persons: SelectPerson[];
};

const {
  organizationId: _,
  createdBy: _1,
  createdExternally: _2,
  createdAt: _3,
  updatedAt: _4,
  ...resultsPublicCols
} = getColumns(resultsTable);

export { resultsPublicCols };

export type ResultResponse = Pick<SelectResult, keyof typeof resultsPublicCols>;
