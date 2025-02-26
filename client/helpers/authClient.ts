import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { auth } from "~/server/auth.ts";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
  ],
});

inferAdditionalFields<typeof auth>();
