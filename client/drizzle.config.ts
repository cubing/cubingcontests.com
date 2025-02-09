// This file is only used by Drizzle Kit (not Drizzle ORM)

import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(".", true);

export default defineConfig({
  out: "./server/db/drizzle",
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.POSTGRES_URI! },
});
