import "server-only";
import { getTableColumns } from "drizzle-orm";
import { boolean, integer, pgTable as table, text, varchar } from "drizzle-orm/pg-core";
import { users as usersTable } from "~/server/db/schema/auth-schema.ts";
import { tableTimestamps } from "../dbUtils.ts";

export const personsTable = table("persons", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  localizedName: text(),
  regionCode: text().notNull(),
  wcaId: varchar({ length: 10 }),
  approved: boolean().default(false).notNull(),
  createdBy: text().references(() => usersTable.id, { onDelete: "set null" }),
  createdExternally: boolean().default(false).notNull(),
  ...tableTimestamps,
});

export type InsertPerson = typeof personsTable.$inferInsert;
export type SelectPerson = typeof personsTable.$inferSelect;

const {
  createdBy: _,
  createdExternally: _1,
  createdAt: _2,
  updatedAt: _3,
  ...personsPublicCols
} = getTableColumns(personsTable);
export { personsPublicCols };

export type PersonResponse = Pick<SelectPerson, keyof typeof personsPublicCols>;
