import "server-only";
import { boolean, integer, pgEnum, pgTable as table, text } from "drizzle-orm/pg-core";
import { tableTimestamps } from "../dbUtils.ts";
import { getTableColumns } from "drizzle-orm/utils";
import { EventCategoryValues, EventFormatValues, RoundFormatValues } from "~/helpers/types.ts";

export const eventFormatEnum = pgEnum("event_format", EventFormatValues);
export const roundFormatEnum = pgEnum("round_format", RoundFormatValues);
export const eventCategoryEnum = pgEnum("event_category", EventCategoryValues);

export const eventsTable = table("events", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: text().notNull().unique(),
  name: text().notNull(),
  category: eventCategoryEnum().notNull(),
  rank: integer().notNull(),
  format: eventFormatEnum().notNull(),
  defaultRoundFormat: roundFormatEnum().notNull(),
  participants: integer().notNull(),
  submissionsAllowed: boolean().notNull(),
  removedWca: boolean().notNull(),
  hasMemo: boolean().notNull(),
  hidden: boolean().notNull(),
  description: text(),
  rule: text(),
  ...tableTimestamps,
});

export type SelectEvent = typeof eventsTable.$inferSelect;

const {
  rule: _, // technically not a private column, but it's not needed most of the time
  createdAt: _1,
  updatedAt: _2,
  ...eventsPublicCols
} = getTableColumns(eventsTable);
export { eventsPublicCols };

export type EventResponse = Pick<SelectEvent, keyof typeof eventsPublicCols>;
