import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";

const db = drizzle(process.env.POSTGRES_URI!);

export default db;
