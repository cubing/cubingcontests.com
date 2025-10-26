import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./relations.ts";

export const db = drizzle({
  connection: process.env.POSTGRES_URI!,
  casing: "snake_case",
  relations,
});
