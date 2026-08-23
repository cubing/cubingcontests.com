import "server-only";
import { getColumns, sql } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { C } from "~/helpers/constants.ts";
import type { Schedule } from "~/helpers/types/Schedule.ts";
import { ContestStateValues, ContestTypeValues } from "~/helpers/types.ts";
import { tableTimestamps } from "~/server/db/db-utils.ts";
import { regionsTable } from "~/server/db/schema/regions.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";
import { organizationsTable, usersTable } from "./auth-schema.ts";

export const contestStateEnum = rrSchema.enum("contest_state", ContestStateValues);
export const contestTypeEnum = rrSchema.enum("contest_type", ContestTypeValues);

export const contestsTable = rrSchema.table(
  "contests",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    competitionId: d.text().notNull(),
    state: contestStateEnum().default("created").notNull(),
    name: d.text().notNull(),
    shortName: d.varchar({ length: C.maxContestShortName }).notNull(),
    type: contestTypeEnum().notNull(),
    regionCode: d.text().notNull(),
    city: d.text().notNull(),
    venue: d.text(),
    address: d.text(),
    latitudeMicrodegrees: d.integer().notNull(),
    longitudeMicrodegrees: d.integer().notNull(),
    startDate: d.timestamp().notNull(),
    endDate: d.timestamp().notNull(),
    startTime: d.timestamp(), // only used for meetups
    timezone: d.text(), // only used for meetups
    organizerIds: d.integer().array().notNull(), // person IDs of the organizers
    contact: d.text(),
    description: d.text(),
    competitorLimit: d.integer(),
    participants: d.integer().default(0).notNull(),
    schedule: d.jsonb().$type<Schedule>(), // not used for meetups
    adminNotes: d.text(),
    createdBy: d.text().references(() => usersTable.id, { onDelete: "set null" }), // this can be null if the user has been deleted
    ...tableTimestamps,
  },
  (table) => [
    d.unique("unique_contests_competition_id").on(table.organizationId, table.competitionId),
    d
      .foreignKey({
        columns: [table.organizationId, table.regionCode],
        foreignColumns: [regionsTable.organizationId, regionsTable.code],
        name: "contests_region_code_fk",
      })
      .onUpdate("cascade"),
    d.check(
      "contests_meetup_check",
      sql`(${table.type} <> 'meetup'
          AND ${table.startTime} IS NULL
          AND ${table.timezone} IS NULL
          AND ${table.schedule} IS NOT NULL)
        OR (${table.type} = 'meetup'
          AND ${table.startTime} IS NOT NULL
          AND ${table.timezone} IS NOT NULL
          AND ${table.schedule} IS NULL)`,
    ),
  ],
);

export type InsertContest = typeof contestsTable.$inferInsert;
export type SelectContest = typeof contestsTable.$inferSelect;

const {
  organizationId: _,
  schedule: _1, // technically not a private column, but it's not needed most of the time
  adminNotes: _2,
  createdBy: _3,
  createdAt: _4,
  updatedAt: _5,
  ...contestsPublicCols
} = getColumns(contestsTable);

export { contestsPublicCols };

export type ContestResponse = Pick<SelectContest, keyof typeof contestsPublicCols>;
