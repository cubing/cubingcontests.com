import "server-only";
import { getColumns } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { organizationsTable } from "~/server/db/schema/auth-schema.ts";
import { contestsTable } from "~/server/db/schema/contests.ts";
import { eventsTable } from "~/server/db/schema/events.ts";
import { matchesTable, winnerEnum } from "~/server/db/schema/matches.ts";
import { resultsTable } from "~/server/db/schema/results.ts";
import { roundsTable } from "~/server/db/schema/rounds.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";
import { tableTimestamps } from "../dbUtils.ts";

export const setsTable = rrSchema.table(
  "sets",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    competitionId: d.text().notNull(),
    eventId: d.text().notNull(),
    roundId: d
      .integer()
      .references(() => roundsTable.id)
      .notNull(),
    bracketNumber: d.integer().notNull(), // corresponds to round.brackets.[N].bracketNumber
    matchId: d
      .integer()
      .references(() => matchesTable.id)
      .notNull(),
    attemptWinners: winnerEnum().array().default([]).notNull(),
    result1: d.integer().references(() => resultsTable.id),
    result2: d.integer().references(() => resultsTable.id),
    setWinner: winnerEnum(),
    ...tableTimestamps,
  },
  (table) => [
    d
      .foreignKey({
        columns: [table.organizationId, table.competitionId],
        foreignColumns: [contestsTable.organizationId, contestsTable.competitionId],
        name: "sets_competition_id_fk",
      })
      .onUpdate("cascade"),
    d
      .foreignKey({
        columns: [table.organizationId, table.eventId],
        foreignColumns: [eventsTable.organizationId, eventsTable.eventId],
        name: "sets_event_id_fk",
      })
      .onUpdate("cascade"),
  ],
);

export type InsertSet = typeof setsTable.$inferInsert;
export type SelectSet = typeof setsTable.$inferSelect;

const { organizationId: _, createdAt: _1, updatedAt: _2, ...setsPublicCols } = getColumns(setsTable);

export { setsPublicCols };

export type SetResponse = Pick<SelectSet, keyof typeof setsPublicCols>;
