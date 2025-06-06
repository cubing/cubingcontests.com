import "server-only";
import { betterAuth } from "better-auth";
import * as bcrypt from "bcrypt";
import { db } from "./db/provider.ts";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, username } from "better-auth/plugins";
import { accountsTable, sessionsTable, usersTable, verificationsTable } from "~/server/db/schema/auth-schema.ts";
import { C } from "~/helpers/constants.ts";
import { sendResetPassword, sendVerificationCode } from "~/server/mailer.ts";
import { ac, admin, mod } from "~/server/permissions.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
    },
  }),
  plugins: [
    nextCookies(),
    username(),
    adminPlugin({
      ac,
      roles: {
        admin,
        mod,
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: ({ user, url }) => sendResetPassword(user.email, url),
    password: {
      hash: (password: string) => bcrypt.hash(password, C.passwordSaltRounds),
      verify: (data: { hash: string; password: string }) => bcrypt.compare(data.password, data.hash),
    },
  },
  emailVerification: {
    sendVerificationEmail: ({ user, url }) => sendVerificationCode(user.email, url),
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
      personId: {
        type: "number",
        required: false,
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
});
