import "server-only";
import { getTableColumns, sql } from "drizzle-orm";
import { integer, pgEnum, pgTable as table, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "~/server/db/schema/auth-schema.ts";

const collectiveSolutionStateEnum = pgEnum("state", [
  "ongoing",
  "solved",
  "archived",
]);

const collectiveSolutions = table("collective_solutions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: varchar({ length: 32 }).notNull(),
  attemptNumber: serial().notNull(),
  state: collectiveSolutionStateEnum().default("ongoing").notNull(),
  scramble: text().notNull(),
  solution: text().default("").notNull(),
  lastUserWhoInteracted: text().references(() => users.id, { onDelete: "set null" }), // this can be null if that user has been deleted
  usersWhoMadeMoves: text().references(() => users.id).array().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => sql`now()`),
});

type SelectCollectiveSolution = typeof collectiveSolutions.$inferSelect;
type InsertCollectiveSolution = typeof collectiveSolutions.$inferInsert;

const {
  lastUserWhoInteracted: _,
  usersWhoMadeMoves: _1,
  createdAt: _2,
  updatedAt: _3,
  ...collectiveSolutionsPublicCols
} = getTableColumns(collectiveSolutions);

type CollectiveSolutionResponse = Pick<SelectCollectiveSolution, keyof typeof collectiveSolutionsPublicCols>;

export {
  type CollectiveSolutionResponse,
  collectiveSolutions,
  collectiveSolutionsPublicCols,
  collectiveSolutionStateEnum,
  type InsertCollectiveSolution,
  type SelectCollectiveSolution,
};
