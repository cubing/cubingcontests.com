import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  updatedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
};
