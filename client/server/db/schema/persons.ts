import "server-only";
import { getTableColumns } from "drizzle-orm";
import { boolean, integer, serial, pgTable as table, text, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "~/server/db/schema/auth-schema.ts";
import { tableTimestamps } from "../dbUtils.ts";

export const personsTable = table("persons", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  personId: serial().notNull().unique(),
  name: text().notNull(),
  localizedName: text(),
  countryIso2: varchar({ length: 2 }).notNull(),
  wcaId: varchar({ length: 10 }),
  approved: boolean().notNull(),
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
