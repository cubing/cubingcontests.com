import {
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { Role } from "~/helpers/enums";

export const roleEnum = pgEnum(
  "role",
  Object.values(Role) as [string, ...string[]],
);

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  personId: integer().unique(),
  username: varchar({ length: 30 }).unique().notNull(),
  email: varchar({ length: 100 }).unique().notNull(),
  password: text().notNull(),
  // REFACTOR AUTHORIZATION WITH BETTER AUTH!
  roles: roleEnum().array().notNull(),
  confirmationCodeHash: text(),
  confirmationCodeAttempts: smallint(),
  cooldownStarted: timestamp(),
  passwordResetCodeHash: text(),
  passwordResetStarted: timestamp(),
});
