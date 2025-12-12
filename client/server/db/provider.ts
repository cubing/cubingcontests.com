import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import { relations } from "./relations.ts";

export const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL!,
    // ssl: "verify-full",
    // Uncomment this if using Supabase "Transaction" pool mode (see https://orm.drizzle.team/docs/connect-supabase)
    // prepare: false,
  },
  casing: "snake_case",
  relations,
});
