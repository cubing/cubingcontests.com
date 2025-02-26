// import "server-only";
import { getTableColumns } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable as table,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import omit from "lodash/omit";
import { timestamps } from "~/server/db/dbHelpers.ts";
import { users } from "~/server/db/schema/auth-schema.ts";

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

const privateColumns = [
  "lastUserWhoInteracted",
  "usersWhoMadeMoves",
  "createdAt",
  "updatedAt",
] as const;

export const collectiveSolutionsPublicColumns = omit(
  getTableColumns(collectiveSolutions),
  privateColumns,
);

export type SelectCollectiveSolution = typeof collectiveSolutions.$inferSelect;
export type InsertCollectiveSolution = typeof collectiveSolutions.$inferInsert;

export type CollectiveSolutionResponse = Omit<
  SelectCollectiveSolution,
  (typeof privateColumns)[number]
>;
