import { timestamp } from "drizzle-orm/pg-core";

export const tableTimestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
};
