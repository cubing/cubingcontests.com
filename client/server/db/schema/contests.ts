import "server-only";
import {
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable as table,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { getTableColumns, sql } from "drizzle-orm";
import { usersTable } from "./auth-schema.ts";
import { ContestStateValues, ContestTypeValues } from "~/helpers/types.ts";
import { tableTimestamps } from "../dbUtils.ts";
import { personsTable } from "./persons.ts";
import { Schedule } from "~/helpers/types/Schedule.ts";

export const contestStateEnum = pgEnum("contest_state", ContestStateValues);
export const contestTypeEnum = pgEnum("contest_type", ContestTypeValues);

export const contestsTable = table("contests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  competitionId: text().notNull().unique(),
  state: contestStateEnum().notNull(),
  name: text().notNull(),
  // FIX THIS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // shortName: varchar({ length: 32 }).notNull(),
  shortName: varchar({ length: 60 }).notNull(),
  type: contestTypeEnum().notNull(),
  city: text().notNull(),
  countryIso2: varchar({ length: 2 }).notNull(),
  venue: text().notNull(),
  address: text().notNull(),
  latitudeMicrodegrees: integer().notNull(),
  longitudeMicrodegrees: integer().notNull(),
  startDate: timestamp().notNull(),
  endDate: timestamp().notNull(),
  startTime: timestamp(), // only used for meetups
  timeZone: text(), // only used for meetups
  organizers: integer().references(() => personsTable.id).array().notNull(),
  contact: text(),
  description: text().notNull(),
  competitorLimit: integer(),
  // events: integer().references(() => eventsTable.id).array().notNull(),
  // rounds: integer().references(() => roundsTable.id).array().notNull(),
  participants: integer().default(0).notNull(),
  queuePosition: integer(),
  schedule: jsonb().$type<Schedule>(), // not used for meetups
  createdBy: text().references(() => usersTable.id, { onDelete: "set null" }), // this can be null if the user has been deleted
  ...tableTimestamps,
}, (table) => [
  uniqueIndex("contests_competition_id_idx").on(table.competitionId),
  check(
    "contests_meetup_check",
    sql`(${table.type} <> 'meetup'
        AND ${table.startTime} IS NULL
        AND ${table.timeZone} IS NULL
        AND ${table.competitorLimit} IS NOT NULL)
      OR (${table.type} = 'meetup'
        AND ${table.startTime} IS NOT NULL
        AND ${table.timeZone} IS NOT NULL
        AND ${table.schedule} IS NULL)`,
  ),
]);

export type SelectContest = typeof contestsTable.$inferSelect;

const {
  schedule: _, // technically not a private column, but it's not needed most of the time
  createdAt: _1,
  updatedAt: _2,
  ...contestsPublicCols
} = getTableColumns(contestsTable);
export { contestsPublicCols };

export type ContestResponse = Pick<SelectContest, keyof typeof contestsPublicCols>;
