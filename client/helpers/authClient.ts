import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import { auth } from "~/server/auth.ts";
import { ac, admin } from "~/server/permissions.ts";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    adminClient({
      ac,
      roles: {
        admin,
      },
    }),
    inferAdditionalFields<typeof auth>(),
  ],
});

// export const canAccessModDashboard = await authClient.admin.hasPermission({ permissions: { modDashboard: ["view"] } });
