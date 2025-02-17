import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api2/auth`, // the route is the same as in auth.ts
});
