import "server-only";
import { apiKey } from "@better-auth/api-key";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization, testUtils, username } from "better-auth/plugins";
import { dbMock as db } from "~/__mocks__/db-mock.ts";
import { HAS_CREDENTIAL_AUTH } from "~/helpers/constants.ts";
import {
  accountsTable as accounts,
  apikeysTable as apikeys,
  invitationsTable as invitations,
  membersTable as members,
  organizationsTable as organizations,
  sessionsTable as sessions,
  usersTable as users,
  verificationsTable as verifications,
} from "~/server/db/schema/auth-schema.ts";
import {
  admin as orgAdminRole,
  organizationAc,
  member as orgMemberRole,
  mod as orgModRole,
  owner as orgOwnerRole,
  videoBasedResultReviewer as orgVideoBasedResultReviewerRole,
} from "~/server/organization-permissions.ts";
import { ac, admin, user } from "~/server/permissions.ts";

export const authMock = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      users,
      sessions,
      accounts,
      verifications,
      organizations,
      members,
      invitations,
      apikeys,
    },
    usePlural: true,
  }),
  plugins: [
    testUtils(),
    username({
      maxUsernameLength: 40,
      usernameValidator: (username) => /^[0-9a-zA-Z-_.]*$/.test(username),
    }),
    adminPlugin({
      // authClient has to match this
      ac,
      roles: { admin, user },
    }),
    organization({
      // allowUserToCreateOrganization: (user) => {},
      // authClient has to match this
      ac: organizationAc,
      roles: {
        owner: orgOwnerRole,
        admin: orgAdminRole,
        mod: orgModRole,
        videoBasedResultReviewer: orgVideoBasedResultReviewerRole,
        member: orgMemberRole,
      },
      cancelPendingInvitationsOnReInvite: true,
      membershipLimit: 100_000, // TO-DO: THIS IS TEMPORARY!!!
      requireEmailVerificationOnInvitation: true,
      schema: {
        member: {
          additionalFields: {
            personId: {
              type: "number",
              required: false,
              unique: true,
              input: false,
            },
          },
        },
      },
    }),
    apiKey({
      configId: "contest_keys",
      references: "user",
      defaultPrefix: "cntst_",
      enableMetadata: true,
      keyExpiration: {
        defaultExpiresIn: 15 * 24 * 60 * 60, // 15 days
        disableCustomExpiresTime: true,
      },
      permissions: {
        defaultPermissions: {
          competitions: ["update"],
          meetups: ["update"],
        },
      },
    }),
    nextCookies(),
  ],
  emailAndPassword: {
    enabled: HAS_CREDENTIAL_AUTH,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    afterEmailVerification: async (user) => {
      if (process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED !== "true")
        await authMock.api.addMember({ body: { userId: user.id, role: ["member"], organizationId: "default" } });
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        unique: true,
      },
    },
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
});
