import "server-only";
import { getTableColumns, sql } from "drizzle-orm";
import { boolean, integer, pgTable as table, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "~/server/db/schema/auth-schema.ts";

const persons = table("persons", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  personId: serial().notNull(),
  name: text().notNull(),
  localizedName: text(),
  countryIso2: varchar({ length: 2 }).notNull(),
  wcaId: varchar({ length: 10 }),
  approved: boolean(),
  createdBy: text().references(() => users.id, { onDelete: "set null" }), // this can be null if that user has been deleted
  createdExternally: boolean(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => sql`now()`),
});

type SelectPerson = typeof persons.$inferSelect;
type InsertPerson = typeof persons.$inferInsert;

const {
  createdBy: _,
  createdExternally: _1,
  createdAt: _2,
  updatedAt: _3,
  ...personsPublicCols
} = getTableColumns(persons);

type PersonResponse = Pick<SelectPerson, keyof typeof personsPublicCols>;

export { type InsertPerson, type PersonResponse, persons, personsPublicCols, type SelectPerson };
