import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle({
  connection: process.env.POSTGRES_URI!,
  casing: "snake_case",
});
