import { Role } from "~/helpers/enums.ts";
import {
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  personId: integer().unique(),
  username: varchar({ length: 30 }).notNull().unique(),
  email: varchar({ length: 100 }).notNull().unique(),
  password: text().notNull(),
  // THIS IS ACTUALLY MEANT TO BE AN ARRAY OF VALUES AND MAYBE I SHOULD REFACTOR HOW AUTHORIZATION WORKS ANYWAYS
  // roles: pgEnum("role", Object.values(Role) as any),
  confirmationCodeHash: text(),
  confirmationCodeAttempts: smallint(),
  cooldownStarted: timestamp(),
  passwordResetCodeHash: text(),
  passwordResetStarted: timestamp(),
});
