import "server-only";
import { getTableColumns } from "drizzle-orm";
import { integer, pgEnum, pgTable as table, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "~/server/db/schema/auth-schema.ts";

const collectiveSolutionStateEnum = pgEnum("state", [
  "ongoing",
  "solved",
  "archived",
]);

const collectiveSolutionsTable = table("collective_solutions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: varchar({ length: 32 }).notNull(),
  attemptNumber: serial().notNull(),
  state: collectiveSolutionStateEnum().default("ongoing").notNull(),
  scramble: text().notNull(),
  solution: text().default("").notNull(),
  lastUserWhoInteracted: text().references(() => usersTable.id, { onDelete: "set null" }), // this can be null if that user has been deleted
  usersWhoMadeMoves: text().references(() => usersTable.id).array().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
});

type SelectCollectiveSolution = typeof collectiveSolutionsTable.$inferSelect;
type InsertCollectiveSolution = typeof collectiveSolutionsTable.$inferInsert;

const {
  lastUserWhoInteracted: _,
  usersWhoMadeMoves: _1,
  createdAt: _2,
  updatedAt: _3,
  ...collectiveSolutionsPublicCols
} = getTableColumns(collectiveSolutionsTable);

type CollectiveSolutionResponse = Pick<SelectCollectiveSolution, keyof typeof collectiveSolutionsPublicCols>;

export {
  type CollectiveSolutionResponse,
  collectiveSolutionsPublicCols,
  collectiveSolutionsTable,
  collectiveSolutionStateEnum,
  type InsertCollectiveSolution,
  type SelectCollectiveSolution,
};
