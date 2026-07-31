import "server-only";
import { apiKey } from "@better-auth/api-key";
import { stripe } from "@better-auth/stripe";
import { betterAuth, type SocialProviders } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, genericOAuth, organization, username } from "better-auth/plugins";
import { sql } from "drizzle-orm";
import Stripe from "stripe";
import {
  baseUrl,
  HAS_CREDENTIAL_AUTH,
  HAS_GOOGLE_AUTH,
  HAS_WCA_AUTH,
  IS_RR_INSTANCE,
  rrBasicLimits,
  rrPremiumLimits,
} from "~/helpers/constants.ts";
import { getHasRole } from "~/helpers/utility-functions.ts";
import { db } from "~/server/db/provider.ts";
import {
  accountsTable as accounts,
  apikeysTable as apikeys,
  invitationsTable as invitations,
  membersTable as members,
  organizationsTable as organizations,
  organizationsTable,
  sessionsTable as sessions,
  subscriptionsTable as subscriptions,
  usersTable as users,
  verificationsTable as verifications,
} from "~/server/db/schema/auth-schema.ts";
import {
  sendAccountDeletedEmail,
  sendOrganizationInvitationEmail,
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "~/server/email/mailer.ts";
import {
  admin as orgAdminRole,
  organizationAc,
  member as orgMemberRole,
  mod as orgModRole,
  owner as orgOwnerRole,
  videoBasedResultReviewer as orgVideoBasedResultReviewerRole,
} from "~/server/organization-permissions.ts";
import { ac, admin, user } from "~/server/permissions.ts";
import { logMessage } from "~/server/server-only-functions/server-only-functions.ts";

if (process.env.NEXT_PHASE !== "phase-production-build") {
  if (!process.env.BETTER_AUTH_URL) console.error("BETTER_AUTH_URL environment variable not set!");
  if (!process.env.BETTER_AUTH_SECRET) console.error("BETTER_AUTH_SECRET environment variable not set!");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.BETTER_AUTH_SECRET === "secret_thats_long_enough_to_be_accepted_by_better_auth"
  ) {
    throw new Error("BETTER_AUTH_SECRET cannot be set to the default value in production!");
  }
}

export const stripeClient =
  IS_RR_INSTANCE && process.env.NEXT_PHASE !== "phase-production-build"
    ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-06-24.dahlia",
      })
    : undefined;

async function changeShowDonationLinks(organizationId: string, showDonationLinks: boolean) {
  await db.execute(
    sql`UPDATE ${organizationsTable}
        SET metadata = JSONB_SET(metadata::jsonb, '{showDonationLinks}', '${showDonationLinks ? sql.raw("true") : sql.raw("false")}')
        WHERE ${organizationsTable.id} = '${sql.raw(organizationId)}'`,
  );
}

// MAKE SURE TO UPDATE THE AUTH MOCK ACCORDINGLY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

export const auth = betterAuth({
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
      subscriptions,
      apikeys,
    },
    usePlural: true,
  }),
  plugins: [
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
      sendInvitationEmail: async (data) => {
        if (process.env.EMAIL_HOST)
          logMessage("RR0039", `Sending invitation to ${data.organization.name} to email ${data.email}`);

        sendOrganizationInvitationEmail(data.email, {
          organizationName: data.organization.name,
          organizationSlug: data.organization.slug,
          invitedByUsername: data.inviter.user.name,
          invitedByEmail: data.inviter.user.email,
          inviteLink: `${baseUrl}/accept-invitation/${data.id}`,
        });
      },
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
      rateLimit: {
        enabled: true,
        timeWindow: 24 * 60 * 60 * 1000, // 1 day
        maxRequests: 1000,
      },
      permissions: {
        defaultPermissions: {
          competitions: ["update"],
          meetups: ["update"],
        },
      },
    }),
    ...(HAS_WCA_AUTH
      ? [
          genericOAuth({
            config: [
              {
                providerId: "wca",
                clientId: process.env.WCA_OAUTH_CLIENT_ID!,
                clientSecret: process.env.WCA_OAUTH_SECRET,
                discoveryUrl: "https://www.worldcubeassociation.org/.well-known/openid-configuration",
                // issuer: "https://www.worldcubeassociation.org",
                // requireIssuerValidation: true, // the WCA doesn't support this
                scopes: ["public", "openid", "email", "profile"],
                mapProfileToUser: async (profile) => ({ ...profile, emailVerified: true }),
              },
            ],
          }),
        ]
      : []),
    ...(IS_RR_INSTANCE
      ? [
          stripe({
            stripeClient: stripeClient!,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            requireEmailVerification: true,
            organization: {
              enabled: true,
            },
            subscription: {
              enabled: true,
              plans: [
                {
                  name: "Basic",
                  lookupKey: "rr_basic_monthly",
                  annualDiscountLookupKey: "rr_basic_annual",
                  limits: rrBasicLimits,
                  freeTrial: {
                    days: 30,
                    // These can be used for email sending
                    // onTrialStart: async (subscription) => {},
                    // onTrialEnd: async ({ subscription }, ctx) => {},
                    // onTrialExpired: async (subscription, ctx) => {},
                  },
                },
                {
                  name: "Premium",
                  lookupKey: "rr_premium_monthly",
                  annualDiscountLookupKey: "rr_premium_annual",
                  limits: rrPremiumLimits,
                  freeTrial: {
                    days: 30,
                  },
                },
              ],
              // Check if the user is the owner of the space the subscription is for
              authorizeReference: async ({ user, referenceId }) => {
                const member = await db.query.members.findFirst({
                  where: { organizationId: referenceId, userId: user.id },
                });
                return Boolean(member && getHasRole("owner", member.role));
              },
              onSubscriptionComplete: async ({ subscription }) => {
                await changeShowDonationLinks(subscription.referenceId, subscription.plan === "basic");
              },
              onSubscriptionCreated: async ({ subscription }) => {
                await changeShowDonationLinks(subscription.referenceId, subscription.plan === "basic");
              },
              onSubscriptionUpdate: async ({ subscription }) => {
                await changeShowDonationLinks(subscription.referenceId, subscription.plan === "basic");
              },
              onSubscriptionCancel: async ({ subscription }) => {
                await changeShowDonationLinks(subscription.referenceId, true);
              },
              onSubscriptionDeleted: async ({ subscription }) => {
                await changeShowDonationLinks(subscription.referenceId, true);
              },
              getCheckoutSessionParams: async () => {
                return {
                  params: {
                    allow_promotion_codes: true,
                  },
                };
              },
            },
          }),
        ]
      : []),
    nextCookies(),
  ],
  socialProviders: {
    google: HAS_GOOGLE_AUTH
      ? {
          prompt: "select_account",
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }
      : undefined,
  } satisfies SocialProviders,
  emailAndPassword: {
    enabled: HAS_CREDENTIAL_AUTH,
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      if (process.env.EMAIL_HOST) logMessage("RR0031", `Sending reset password email for user with ID ${user.id}`);

      sendResetPasswordEmail(user.email, url);
    },
    onPasswordReset: async ({ user }) => {
      if (process.env.EMAIL_HOST) logMessage("RR0032", `Sending password changed email for user with ID ${user.id}`);

      sendPasswordChangedEmail(user.email);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (process.env.EMAIL_HOST) logMessage("RR0030", `Sending verification email for new user with ID ${user.id}`);

      sendVerificationEmail(user.email, url);
    },
    afterEmailVerification: async (user) => {
      if (process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED !== "true")
        await auth.api.addMember({ body: { userId: user.id, role: ["member"], organizationId: "default" } });
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
      afterDelete: async (user) => {
        if (process.env.EMAIL_HOST) logMessage("RR0036", `Sending user deleted email for user with ID ${user.id}`);

        sendAccountDeletedEmail(user.email);
      },
    },
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.emailVerified && process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED !== "true") {
            auth.api.addMember({ body: { userId: user.id, role: ["member"], organizationId: "default" } });
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if (process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED !== "true") {
            return { data: { ...session, activeOrganizationId: "default" } };
          }
          return { data: session };
        },
      },
    },
  },
});
