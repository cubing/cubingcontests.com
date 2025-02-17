import { betterAuth } from "better-auth";
import { db } from "./db/provider.ts";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  accounts,
  sessions,
  users,
  verifications,
} from "~/server/db/schema/auth-schema.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
  },
  basePath: "/api2/auth", // same as in authClient.ts
});
