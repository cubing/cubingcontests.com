import "server-only";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import z from "zod/v4";
import { authClient } from "~/helpers/authClient.ts";
import { authorizeUser } from "./serverUtilityFunctions.ts";
import { CcServerErrorObject } from "../helpers/types.ts";

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      // null means the user simply needs to be logged in; undefined means authorization isn't necessary
      permissions: z.any().nullable().optional(),
    });
  },
  handleServerError(e): CcServerErrorObject {
    console.error("Action error:", e.message);

    if (e instanceof CcActionError) return { message: e.message, data: e.data };

    return { message: DEFAULT_SERVER_ERROR_MESSAGE };
  },
}).use<{ session: typeof authClient.$Infer.Session }>(async ({ next, metadata }) => {
  // We still want to check authentication when permissions = null
  if (metadata.permissions !== undefined) {
    const session = await authorizeUser({ permissions: metadata.permissions });

    return next({ ctx: { session } });
  } else {
    return next();
  }
});

export class CcActionError extends Error {
  data?: any;

  constructor(message: string, options?: { data: any }, ...rest: any[]) {
    super(message, ...rest);

    this.name = "CcActionError";
    if (options) {
      this.data = options.data;
    }
  }
}
