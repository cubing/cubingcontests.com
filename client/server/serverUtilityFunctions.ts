import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "./auth.ts";
import { CcPermissions } from "./permissions.ts";

export async function checkUserPermissions(userId: string, permissions: CcPermissions) {
  const { success } = await auth.api.userHasPermission({ body: { userId, permissions } });
  return success;
}

export async function authorizeUser({ permissions }: { permissions?: CcPermissions } = {}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  if (permissions) {
    const isAuthorized = await checkUserPermissions(session.user.id, permissions);

    if (!isAuthorized) redirect("/login");
  }

  return session;
}

export async function authorizeAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") redirect("/login");
}
