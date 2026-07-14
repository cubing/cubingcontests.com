import "server-only";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// This file is only used by Drizzle Kit (not Drizzle ORM)

loadEnvConfig(resolve(".."));

if (!process.env.DB_NAME || !process.env.DB_USERNAME || !process.env.DB_PASSWORD) {
  throw new Error("One of these environment variables is not set: DB_NAME, DB_USERNAME, DB_PASSWORD!");
}

export default defineConfig({
  dialect: "postgresql",
  out: "./server/db/drizzle",
  schema: "./server/db/schema",
  migrations: { schema: "record_ranks" },
  // This uses a direct DB connection instead of the Supabase connection pooler
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
  strict: true,
  // verbose: true,
});
