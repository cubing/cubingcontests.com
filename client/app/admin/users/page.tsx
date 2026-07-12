import { headers } from "next/headers";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import { authorizeUser } from "~/server/server-only-functions/server-only-functions.ts";
import ManageUsersScreen from "./ManageUsersScreen.tsx";

async function ManageUsersPage() {
  await authorizeUser({ useOrganization: false, permissions: { user: ["list"] } });

  const [{ users }, accounts] = await Promise.all([
    auth.api.listUsers({ headers: await headers(), query: { sortBy: "createdAt", sortDirection: "desc" } }),
    db.query.accounts.findMany({ columns: { userId: true, providerId: true } }),
  ]);

  if (!users) return <LoadingError loadingEntity="users" />;

  const usersWithProviderIds = users.map((u) => ({
    ...u,
    providerId: accounts.find((a) => a.userId === u.id)!.providerId,
  }));

  return (
    <section>
      <h2 className="mb-4 text-center">Manage Users</h2>

      <ToastMessages className="mx-2" />

      <ManageUsersScreen users={usersWithProviderIds} />
    </section>
  );
}

export default ManageUsersPage;
