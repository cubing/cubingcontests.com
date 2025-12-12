import "server-only";
import { getTableColumns, sql } from "drizzle-orm";
import { boolean, check, integer, pgEnum, smallint, pgTable as table, text } from "drizzle-orm/pg-core";
import { RoundProceedValues, RoundTypeValues } from "~/helpers/types.ts";
import { tableTimestamps } from "../dbUtils.ts";
import { roundFormatEnum } from "./events.ts";

export const roundTypeEnum = pgEnum("round_type", RoundTypeValues);
export const roundProceedEnum = pgEnum("round_proceed", RoundProceedValues);

export const roundsTable = table(
  "rounds",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    competitionId: text().notNull(),
    eventId: text().notNull(),
    roundNumber: smallint().notNull(),
    roundTypeId: roundTypeEnum().notNull(),
    format: roundFormatEnum().notNull(),
    timeLimitCentiseconds: integer(),
    timeLimitCumulativeRoundIds: text().array(),
    cutoffAttemptResult: integer(),
    cutoffNumberOfAttempts: integer(),
    proceedType: roundProceedEnum(),
    proceedValue: integer(),
    open: boolean().default(false).notNull(),
    ...tableTimestamps,
  },
  (table) => [
    check(
      "rounds_timelimit_check",
      sql`(${table.timeLimitCentiseconds} is not null and ${table.timeLimitCumulativeRoundIds} is not null)
        or (${table.timeLimitCentiseconds} is null and ${table.timeLimitCumulativeRoundIds} is null)`,
    ),
    check(
      "rounds_cutoff_check",
      sql`(${table.cutoffAttemptResult} is not null and ${table.cutoffNumberOfAttempts} is not null)
        or (${table.cutoffAttemptResult} is null and ${table.cutoffNumberOfAttempts} is null)`,
    ),
    check(
      "rounds_proceed_check",
      sql`(${table.proceedType} is not null and ${table.proceedValue} is not null)
        or (${table.proceedType} is null and ${table.proceedValue} is null)`,
    ),
    check("rounds_finals_check", sql`${table.roundTypeId} <> 'f' or ${table.proceedType} is null`),
  ],
);

export type SelectRound = typeof roundsTable.$inferSelect;

const { createdAt: _, updatedAt: _1, ...roundsPublicCols } = getTableColumns(roundsTable);
export { roundsPublicCols };

export type RoundResponse = Pick<SelectRound, keyof typeof roundsPublicCols>;
