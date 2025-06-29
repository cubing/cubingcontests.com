import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import ManageUsersScreen from "./ManageUsersScreen.tsx";
import { auth } from "~/server/auth.ts";
import { headers } from "next/headers";
import { personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { db } from "~/server/db/provider.ts";
import { inArray } from "drizzle-orm";

async function ManageUsersPage() {
  await authorizeUser({ permissions: { user: ["list"] } });

  const res = await auth.api.listUsers({
    query: { filterField: "emailVerified", filterValue: true, sortBy: "createdAt", limit: 10000 },
    headers: await headers(),
  });

  if (!res.users) return <h3 className="mt-4 text-center">Error while loading users</h3>;

  const personIds = Array.from(new Set(res.users.filter((u) => u.personId).map((u) => u.personId)));
  const persons = await db.select(personsPublicCols).from(personsTable)
    .where(inArray(personsTable.personId, personIds));

  return <ManageUsersScreen users={res.users} userPersons={persons} />;
}

export default ManageUsersPage;
