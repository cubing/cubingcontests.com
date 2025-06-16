import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import { auth } from "~/server/auth.ts";
import { ac, admin, mod } from "~/server/permissions.ts";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    adminClient({
      ac,
      roles: {
        admin,
        mod,
      },
    }),
    inferAdditionalFields<typeof auth>(),
  ],
});
