import "server-only";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { headers } from "next/headers";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import z from "zod";
import type { FullSession } from "~/helpers/types.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import { OrganizationRoles, type OrgPluginPermissions } from "~/server/organization-permissions.ts";
import { type AdminPluginPermissions, Roles } from "~/server/permissions.ts";
import { authorizeUser, logMessage } from "./server-only-functions/server-only-functions.ts";

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.strictObject({
      auth: z.union([
        z.null(), // doesn't check login at all
        z.strictObject({
          useOrganization: z.literal(false),
          orgPermissions: z.never().optional(),
          orgRole: z.never().optional(),
          permissions: z.custom<AdminPluginPermissions>().optional(),
          role: z.enum(Roles).optional(),
        }),
        z.strictObject({
          useOrganization: z.literal(true),
          orgPermissions: z.custom<OrgPluginPermissions>().optional(),
          orgRole: z.enum(OrganizationRoles).optional(),
          permissions: z.never().optional(),
          role: z.never().optional(),
        }),
      ]),
    });
  },
  // If it's an expected RR error, log it and return it, along with the optional error data.
  // If it's an unexpected error, log it and return the default error message.
  handleServerError(e): RrServerErrorObject {
    if (e instanceof RrActionError) {
      logMessage("RR5002", e.message, { sendErrorLogEmail: true });
      return { message: e.message, data: e.data };
    }

    logMessage("RR5003", e.message, { sendErrorLogEmail: true });
    return { message: DEFAULT_SERVER_ERROR_MESSAGE };
  },
}).use<{ session: FullSession; httpHeaders: ReadonlyHeaders }>(async ({ next, metadata }) => {
  if (process.env.VITEST) {
    const { authMock } = await import("~/__mocks__/auth-mock.ts");
    const ctx = await authMock.$context;
    const authTest = ctx.test;

    const testUser = await db.query.users.findFirst({ where: { username: process.env.TEST_USER || "admin" } });
    const { session, user, headers } = await authTest.login({ userId: testUser!.id });
    await authMock.api.setActiveOrganization({ headers, body: { organizationSlug: "default" } });

    const { organization, member } = metadata.auth
      ? await authorizeUser(metadata.auth, headers)
      : { organization: undefined, member: undefined };

    return next({ ctx: { session: { session, user, organization, member }, httpHeaders: headers } });
  }

  const httpHeaders = await headers();

  if (metadata.auth === null) {
    const session = await auth.api.getSession({ headers: httpHeaders });
    return next({ ctx: { session: session ?? undefined, httpHeaders } });
  } else {
    const session = await authorizeUser(metadata.auth, httpHeaders);
    return next({ ctx: { session, httpHeaders } });
  }
});

export type RrServerErrorObject = {
  message: string;
  data?: any;
};

export class RrActionError extends Error {
  data?: any;

  constructor(message: string, options?: { data: any }, ...rest: any[]) {
    super(message, ...rest);

    this.name = "RrActionError";
    if (options) {
      this.data = options.data;
    }
  }
}
