import "server-only";
import { getColumns, sql } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { RoundProceedValues, RoundTypeValues } from "~/helpers/types.ts";
import { organizationsTable } from "~/server/db/schema/auth-schema.ts";
import { contestsTable } from "~/server/db/schema/contests.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";
import { tableTimestamps } from "../db-utils.ts";
import { eventsTable, roundFormatEnum } from "./events.ts";

export const roundTypeEnum = rrSchema.enum("round_type", RoundTypeValues);
export const roundProceedEnum = rrSchema.enum("round_proceed", RoundProceedValues);

export const roundsTable = rrSchema.table(
  "rounds",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    competitionId: d.text().notNull(),
    eventId: d.text().notNull(),
    roundNumber: d.smallint().notNull(),
    roundTypeId: roundTypeEnum().notNull(),
    format: roundFormatEnum().notNull(),
    timeLimitCentiseconds: d.integer(),
    // If this is not null, it's implied that the round itself is included in the cumulative limit rounds
    timeLimitCumulativeRoundIds: d.integer().array(),
    cutoffAttemptResult: d.integer(),
    cutoffNumberOfAttempts: d.integer(),
    proceedType: roundProceedEnum(),
    proceedValue: d.integer(),
    open: d.boolean().default(false).notNull(),
    ...tableTimestamps,
  },
  (table) => [
    d.unique("unique_rounds").on(table.organizationId, table.competitionId, table.eventId, table.roundNumber),
    d
      .foreignKey({
        columns: [table.organizationId, table.competitionId],
        foreignColumns: [contestsTable.organizationId, contestsTable.competitionId],
        name: "rounds_competition_id_fk",
      })
      .onUpdate("cascade"),
    d
      .foreignKey({
        columns: [table.organizationId, table.eventId],
        foreignColumns: [eventsTable.organizationId, eventsTable.eventId],
        name: "rounds_event_id_fk",
      })
      .onUpdate("cascade"),
    // Cumulative round IDs can only be set when the round has a time limit
    d.check(
      "rounds_timelimit_check",
      sql`${table.timeLimitCumulativeRoundIds} IS NULL OR ${table.timeLimitCentiseconds} IS NOT NULL`,
    ),
    d.check(
      "rounds_cutoff_check",
      sql`(${table.cutoffAttemptResult} IS NOT NULL AND ${table.cutoffNumberOfAttempts} IS NOT NULL)
        OR (${table.cutoffAttemptResult} IS NULL AND ${table.cutoffNumberOfAttempts} IS NULL)`,
    ),
    d.check(
      "rounds_proceed_check",
      sql`(${table.proceedType} IS NOT NULL AND ${table.proceedValue} IS NOT NULL)
        OR (${table.proceedType} IS NULL AND ${table.proceedValue} IS NULL)`,
    ),
    d.check("rounds_finals_check", sql`${table.roundTypeId} <> 'f' OR ${table.proceedType} IS NULL`),
  ],
);

export type InsertRound = typeof roundsTable.$inferInsert;
export type SelectRound = typeof roundsTable.$inferSelect;

const { organizationId: _, createdAt: _1, updatedAt: _2, ...roundsPublicCols } = getColumns(roundsTable);

export { roundsPublicCols };

export type RoundResponse = Pick<SelectRound, keyof typeof roundsPublicCols>;

// Below is a draft of how tournaments could be implemented with two new tables

// round.format = "h2h" (head-to-head)
// round.brackets: {
//   bracketNumber: 1, 2, 3, etc. (for Swiss and Round Robin there's always just one bracket)
//   bracketType: "main" | "losers" | "double-elim-finals" | "double-elim-reset" | "swiss" | "round-robin"
//   stages: 1, 2, 3, etc.
//   seedingStrategy: "best-vs-worst" | "best-vs-2nd" | "random"
// }[]

// These get populated when the tournament round is first created
// matches: {
//   id
//   competitionId
//   roundId
//   bracket
//   stage: 1, 2, 3, etc.
//   position: 1, 2, 3, etc. (just the vertical position within a given stage)
//   open: boolean
//   matchFormat: 1/2/3 (first to N sets)
//   team1: personReference[]
//   team2: personReference[]
//   winner: 1/2/null (null while one of the sets has setWinner = null)
// }

// These are created whenever a new set starts
// sets: {
//   id
//   competitionId
//   roundId
//   matchId
//   setFormat: 1/2/3 (first to N wins)
//   winners: 0/1/2[] (0 means draw)
//   // result.attempts[] corresponds to winners[]. These are optional, because it could be an event that has no actual results to record.
//   result1?: resultReference (add a matchId field to the results table)
//   result2?: resultReference
//   setWinner: 1/2/null
// }
