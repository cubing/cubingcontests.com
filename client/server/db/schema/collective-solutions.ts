import {
  integer,
  pgEnum,
  pgTable as table,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "~/server/db/dbHelpers.ts";
import { users } from "~/server/db/schema/auth-schema";

export const collectiveSolutionStateEnum = pgEnum("state", [
  "ongoing",
  "solved",
  "archived",
]);

export const collectiveSolutions = table("collective_solutions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: varchar({ length: 32 }).notNull(),
  attemptNumber: serial().notNull(),
  state: collectiveSolutionStateEnum().default("ongoing").notNull(),
  scramble: text().notNull(),
  solution: text().default("").notNull(),
  lastUserWhoInteracted: text().references(() => users.id).notNull(),
  usersWhoMadeMoves: text().references(() => users.id).array().notNull(),
  ...timestamps,
});
