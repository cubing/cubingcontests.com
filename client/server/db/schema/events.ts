import "server-only";
import * as d from "drizzle-orm/pg-core";
import { getColumns } from "drizzle-orm/utils";
import { EventCategoryValues, EventFormatValues, RoundFormatValues } from "~/helpers/types.ts";
import { tableTimestamps } from "~/server/db/db-utils.ts";
import { organizationsTable } from "~/server/db/schema/auth-schema.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";

export const eventFormatEnum = rrSchema.enum("event_format", EventFormatValues);
export const roundFormatEnum = rrSchema.enum("round_format", RoundFormatValues);
export const eventCategoryEnum = rrSchema.enum("event_category", EventCategoryValues);

export const eventsTable = rrSchema.table(
  "events",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    eventId: d.text().notNull(),
    name: d.text().notNull(),
    category: d.text().notNull(),
    rank: d.integer().notNull(),
    format: eventFormatEnum().notNull(),
    defaultRoundFormat: roundFormatEnum().notNull(),
    participants: d.integer().notNull(),
    submissionsAllowed: d.boolean().notNull(),
    hasMemo: d.boolean().notNull(),
    hidden: d.boolean().notNull(),
    description: d.text(),
    rule: d.text(),
    importantInfo: d.text(),
    ...tableTimestamps,
  },
  (table) => [d.unique("unique_events_event_id").on(table.organizationId, table.eventId)],
);

export type InsertEvent = typeof eventsTable.$inferInsert;
export type SelectEvent = typeof eventsTable.$inferSelect;

const {
  organizationId: _,
  rule: _1, // technically not a private column, but it's not needed most of the time
  createdAt: _2,
  updatedAt: _3,
  ...eventsPublicCols
} = getColumns(eventsTable);

export { eventsPublicCols };

export type EventResponse = Pick<SelectEvent, keyof typeof eventsPublicCols>;
