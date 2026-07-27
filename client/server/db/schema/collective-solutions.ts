import "server-only";
import { getColumns } from "drizzle-orm";
import { integer, serial, text } from "drizzle-orm/pg-core";
import { usersTable } from "~/server/db/schema/auth-schema.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";
import { tableTimestamps } from "../db-utils.ts";

export const collectiveSolutionStateEnum = rrSchema.enum("state", ["ongoing", "solved", "archived"]);

export const collectiveSolutionsTable = rrSchema.table("collective_solutions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  eventId: text().notNull(),
  attemptNumber: serial().notNull().unique(),
  state: collectiveSolutionStateEnum().default("ongoing").notNull(),
  scramble: text().notNull(),
  solution: text().default("").notNull(),
  lastUserWhoInteractedId: text().references(() => usersTable.id, { onDelete: "set null" }), // this can be null if the user has been deleted
  usersWhoMadeMoves: text().array().notNull(),
  ...tableTimestamps,
});

export type SelectCollectiveSolution = typeof collectiveSolutionsTable.$inferSelect;

const {
  eventId: _, // not a private column, but it's not needed client-side
  lastUserWhoInteractedId: _1,
  usersWhoMadeMoves: _2,
  createdAt: _3,
  updatedAt: _4,
  ...collectiveSolutionsPublicCols
} = getColumns(collectiveSolutionsTable);

export { collectiveSolutionsPublicCols };

export type CollectiveSolutionResponse = Pick<SelectCollectiveSolution, keyof typeof collectiveSolutionsPublicCols>;

export type CurrentCollectiveSolution = Omit<CollectiveSolutionResponse, "id"> & { currentUserInteractedLast: boolean };
