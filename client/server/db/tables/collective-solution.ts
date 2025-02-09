import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "~/server/db/schema.ts";

export const collectiveSolutionStateEnum = pgEnum("state", [
  "ongoing",
  "solved",
  "archived",
]);

export const collectiveSolutionsTable = pgTable("collective_solutions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: varchar({ length: 32 }).notNull(),
  attemptNumber: serial().notNull(),
  state: collectiveSolutionStateEnum().default("ongoing").notNull(),
  scramble: text().notNull(),
  solution: text(),
  lastUserWhoInteracted: integer().references(() => usersTable.id).notNull(),
  usersWhoMadeMoves: integer().references(() => usersTable.id).array()
    .notNull(),
});
