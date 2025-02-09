// This file is only used by Drizzle Kit (not Drizzle ORM)

import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(".", true);
console.log(process.env.POSTGRES_URI);

export default defineConfig({
  out: "./server/db/drizzle",
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  // dbCredentials: { url: process.env.POSTGRES_URI! },
  dbCredentials: {
    url:
      `postgres://${process.env.DB_ADMIN_USERNAME}:${process.env.DB_ADMIN_PASSWORD}@localhost:5432/${process.env.DB_NAME}`,
  },
});
