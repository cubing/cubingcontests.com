import "server-only";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { CcActionError } from "~/helpers/types.ts";
import z from "zod/v4";
import { authClient } from "~/helpers/authClient.ts";
import { authorizeUser } from "./serverUtilityFunctions.ts";

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      // null means the user simply needs to be logged in; undefined means authorization isn't necessary
      permissions: z.any().nullable().optional(),
    });
  },
  handleServerError(e) {
    console.error("Action error:", e.message);

    if (e instanceof CcActionError) {
      return e;
    }

    return new CcActionError(DEFAULT_SERVER_ERROR_MESSAGE);
  },
}).use<{ session: typeof authClient.$Infer.Session }>(async ({ next, metadata }) => {
  // We still want to check authentication when permissions = null
  if (metadata.permissions !== undefined) {
    const session = await authorizeUser(metadata.permissions);

    return next({ ctx: { session } });
  } else {
    return next();
  }
});
