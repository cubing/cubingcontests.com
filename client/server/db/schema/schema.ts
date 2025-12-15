// THIS IS ONLY USED FOR THE VITEST DRIZZLE SETUP!

export * from "./auth-schema.ts";
export * from "./collective-solutions.ts";
export * from "./contests.ts";
export * from "./events.ts";
export * from "./persons.ts";
export * from "./record-configs.ts";
export * from "./results.ts";
export * from "./rounds.ts";

// This didn't seem to work with Supabase the first time I tried it
// export const ccSchema = pgSchema("cubing_contests");
