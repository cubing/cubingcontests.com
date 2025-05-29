import "server-only";
import { ZodError } from "zod/v4";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth.ts";
import { FetchError } from "~/helpers/types/FetchObj.ts";
import { Permissions } from "~/server/permissions.ts";

export function getValidationError(error: ZodError<any>): FetchError<any> {
  return {
    success: false,
    error: {
      code: "VALIDATION",
      message: error.errors.map((e) => e.message).join(" | "),
    },
  };
}

export async function checkUserPermissions(userId: string, permissions: Permissions): Promise<boolean> {
  const { success } = await auth.api.userHasPermission({
    body: { userId, permissions },
  });

  return success;
}

export async function authorizeUser(permissions?: Permissions) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  if (permissions) {
    if (!await checkUserPermissions(session.user.id, permissions)) redirect("/login");
  }

  return session;
}
