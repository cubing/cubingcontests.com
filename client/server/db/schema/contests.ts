import "server-only";
import { getTableColumns, sql } from "drizzle-orm";
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
import type { Schedule } from "~/helpers/types/Schedule.ts";
import { ContestStateValues, ContestTypeValues } from "~/helpers/types.ts";
import { tableTimestamps } from "../dbUtils.ts";
import { users as usersTable } from "./auth-schema.ts";
import { personsTable } from "./persons.ts";

export const contestStateEnum = pgEnum("contest_state", ContestStateValues);
export const contestTypeEnum = pgEnum("contest_type", ContestTypeValues);

export const contestsTable = table(
  "contests",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    competitionId: text().notNull().unique(),
    state: contestStateEnum().default("created").notNull(),
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
    organizers: integer()
      .references(() => personsTable.id)
      .array()
      .notNull(),
    contact: text(),
    description: text().notNull(),
    competitorLimit: integer(),
    participants: integer().default(0).notNull(),
    queuePosition: integer(),
    schedule: jsonb().$type<Schedule>(), // not used for meetups
    createdBy: text().references(() => usersTable.id, { onDelete: "set null" }), // this can be null if the user has been deleted
    ...tableTimestamps,
  },
  (table) => [
    uniqueIndex("contests_competition_id_idx").on(table.competitionId),
    check(
      "contests_meetup_check",
      sql`(${table.type} <> 'meetup'
          and ${table.startTime} is null
          and ${table.timeZone} is null
          and ${table.competitorLimit} is not null
          and ${table.schedule} is not null)
        or (${table.type} = 'meetup'
          and ${table.startTime} is not null
          and ${table.timeZone} is not null
          and ${table.schedule} is null)`,
    ),
  ],
);

export type SelectContest = typeof contestsTable.$inferSelect;

const {
  schedule: _, // technically not a private column, but it's not needed most of the time
  createdBy: _1,
  createdAt: _2,
  updatedAt: _3,
  ...contestsPublicCols
} = getTableColumns(contestsTable);
export { contestsPublicCols };

export type ContestResponse = Pick<SelectContest, keyof typeof contestsPublicCols>;
