import "server-only";
import { getTableColumns } from "drizzle-orm";
import { boolean, integer, pgTable as table, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "~/server/db/schema/auth-schema.ts";

const personsTable = table("persons", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  personId: serial().notNull(),
  name: text().notNull(),
  localizedName: text(),
  countryIso2: varchar({ length: 2 }).notNull(),
  wcaId: varchar({ length: 10 }),
  approved: boolean(),
  createdBy: text().references(() => usersTable.id, { onDelete: "set null" }), // this can be null if that user has been deleted
  createdExternally: boolean(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
});

type SelectPerson = typeof personsTable.$inferSelect;
type InsertPerson = typeof personsTable.$inferInsert;

const {
  createdBy: _,
  createdExternally: _1,
  createdAt: _2,
  updatedAt: _3,
  ...personsPublicCols
} = getTableColumns(personsTable);

type PersonResponse = Pick<SelectPerson, keyof typeof personsPublicCols>;

export { type InsertPerson, type PersonResponse, personsPublicCols, personsTable, type SelectPerson };
