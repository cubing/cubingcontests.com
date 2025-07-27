import "server-only";
import { getTableColumns } from "drizzle-orm";
import { integer, pgEnum, pgTable as table, serial, text, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "~/server/db/schema/auth-schema.ts";
import { tableTimestamps } from "../dbUtils.ts";

export const collectiveSolutionStateEnum = pgEnum("state", ["ongoing", "solved", "archived"]);

export const collectiveSolutionsTable = table("collective_solutions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: varchar({ length: 32 }).notNull(),
  attemptNumber: serial().notNull().unique(),
  state: collectiveSolutionStateEnum().default("ongoing").notNull(),
  scramble: text().notNull(),
  solution: text().default("").notNull(),
  lastUserWhoInteracted: text().references(() => usersTable.id, { onDelete: "set null" }), // this can be null if the user has been deleted
  usersWhoMadeMoves: text().references(() => usersTable.id).array().notNull(),
  ...tableTimestamps,
});

export type SelectCollectiveSolution = typeof collectiveSolutionsTable.$inferSelect;

const {
  lastUserWhoInteracted: _,
  usersWhoMadeMoves: _1,
  createdAt: _2,
  updatedAt: _3,
  ...collectiveSolutionsPublicCols
} = getTableColumns(collectiveSolutionsTable);
export { collectiveSolutionsPublicCols };

export type CollectiveSolutionResponse = Pick<SelectCollectiveSolution, keyof typeof collectiveSolutionsPublicCols>;
