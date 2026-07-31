import "server-only";
import { getColumns } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { organizationsTable } from "~/server/db/schema/auth-schema.ts";
import { contestsTable } from "~/server/db/schema/contests.ts";
import { eventsTable } from "~/server/db/schema/events.ts";
import { roundsTable } from "~/server/db/schema/rounds.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";
import { tableTimestamps } from "../dbUtils.ts";

export type Team = {
  teamName?: string;
  participantIds: number[]; // references the persons table
  regionCode?: string;
};

export const winnerEnum = rrSchema.enum("h2h_winner", ["1", "2", "draw"]);

export const matchesTable = rrSchema.table(
  "matches",
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
      .references(() => roundsTable.id, { onDelete: "cascade" })
      .notNull(),
    bracketNumber: d.integer().notNull(), // corresponds to round.brackets.[N].bracketNumber
    stage: d.integer().notNull(), // the "horizontal" position of the match in a bracket
    position: d.integer().notNull(), // the "vertical" position of the match in a bracket
    setsToWinMatch: d.integer().notNull(),
    attemptsToWinSet: d.integer().notNull(),
    team1: d.jsonb().$type<Team>().notNull(),
    team2: d.jsonb().$type<Team>().notNull(),
    open: d.boolean().default(false).notNull(), // matches are opened and closed at the same time for a whole stage
    winner: winnerEnum(),
    ...tableTimestamps,
  },
  (table) => [
    d
      .unique("unique_matches")
      .on(table.organizationId, table.competitionId, table.roundId, table.bracketNumber, table.stage, table.position),
    d
      .foreignKey({
        columns: [table.organizationId, table.competitionId],
        foreignColumns: [contestsTable.organizationId, contestsTable.competitionId],
        name: "matches_competition_id_fk",
      })
      .onUpdate("cascade"),
    d
      .foreignKey({
        columns: [table.organizationId, table.eventId],
        foreignColumns: [eventsTable.organizationId, eventsTable.eventId],
        name: "matches_event_id_fk",
      })
      .onUpdate("cascade"),
  ],
);

export type InsertMatch = typeof matchesTable.$inferInsert;
export type SelectMatch = typeof matchesTable.$inferSelect;

const { organizationId: _, createdAt: _1, updatedAt: _2, ...matchesPublicCols } = getColumns(matchesTable);

export { matchesPublicCols };

export type MatchResponse = Pick<SelectMatch, keyof typeof matchesPublicCols>;
