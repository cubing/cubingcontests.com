import { collectiveSolutions } from "~/server/db/schema/collective-solutions.ts";

export type SelectCollectiveSolution = typeof collectiveSolutions.$inferSelect;
export type InsertCollectiveSolution = typeof collectiveSolutions.$inferInsert;
