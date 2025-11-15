import "server-only";
import { boolean, check, integer, pgEnum, pgTable as table, text } from "drizzle-orm/pg-core";
import { getTableColumns, sql } from "drizzle-orm";
import { tableTimestamps } from "../dbUtils.ts";
import { RoundProceedValues, RoundTypeValues } from "~/helpers/types.ts";
import { roundFormatEnum } from "./events.ts";

export const roundTypeEnum = pgEnum("round_type", RoundTypeValues);
export const roundProceedEnum = pgEnum("round_proceed", RoundProceedValues);

export const roundsTable = table("rounds", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  roundId: text().notNull(),
  competitionId: text().notNull(),
  roundTypeId: roundTypeEnum().notNull(),
  format: roundFormatEnum().notNull(),
  timeLimitCentiseconds: integer(),
  timeLimitCumulativeRoundIds: text().array(),
  cutoffAttemptResult: integer(),
  cutoffNumberOfAttempts: integer(),
  proceedType: roundProceedEnum(),
  proceedValue: integer(),
  // results: integer().references(() => resultsTable.id).array().notNull(),
  open: boolean().notNull(),
  ...tableTimestamps,
}, (table) => [
  check(
    "rounds_timelimit_check",
    sql`(${table.timeLimitCentiseconds} IS NOT NULL AND ${table.timeLimitCumulativeRoundIds} IS NOT NULL)
      OR (${table.timeLimitCentiseconds} IS NULL AND ${table.timeLimitCumulativeRoundIds} IS NULL)`,
  ),
  check(
    "rounds_cutoff_check",
    sql`(${table.cutoffAttemptResult} IS NOT NULL AND ${table.cutoffNumberOfAttempts} IS NOT NULL)
      OR (${table.cutoffAttemptResult} IS NULL AND ${table.cutoffNumberOfAttempts} IS NULL)`,
  ),
  check(
    "rounds_proceed_check",
    sql`(${table.proceedType} IS NOT NULL AND ${table.proceedValue} IS NOT NULL)
      OR (${table.proceedType} IS NULL AND ${table.proceedValue} IS NULL)`,
  ),
  check("rounds_finals_check", sql`${table.roundTypeId} <> 'f' OR ${table.proceedType} IS NULL`),
]);

export type SelectRound = typeof roundsTable.$inferSelect;

const {
  createdAt: _,
  updatedAt: _1,
  ...roundsPublicCols
} = getTableColumns(roundsTable);
export { roundsPublicCols };

export type RoundResponse = Pick<SelectRound, keyof typeof roundsPublicCols>;
