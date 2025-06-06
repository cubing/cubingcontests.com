import ManageCompetitorsScreen from "~/app/mod/competitors/ManageCompetitorsScreen.tsx";
import { Creator } from "~/helpers/types.ts";
import { authorizeUser, checkUserPermissions } from "~/server/serverUtilityFunctions.ts";
import { db } from "~/server/db/provider.ts";
import { desc, eq, inArray } from "drizzle-orm";
import { PersonResponse, personsPublicCols, personsTable as table, SelectPerson } from "~/server/db/schema/persons.ts";
import { usersTable } from "~/server/db/schema/auth-schema.ts";

async function CompetitorsPage() {
  const { user } = await authorizeUser({ permissions: { persons: ["create", "update", "delete"] } });
  const isAdmin = await checkUserPermissions(user.id, { persons: ["approve"] });

  try {
    let persons: SelectPerson[] | PersonResponse[];
    const query = (isAdmin ? db.select() : db.select(personsPublicCols)).from(table);
    if (!isAdmin) persons = await query.where(eq(table.createdBy, user.id)).orderBy(desc(table.personId));
    else persons = await query.orderBy(desc(table.personId));

    let users: Creator[] | undefined;

    if (isAdmin) {
      const personIds = Array.from(new Set(persons.map((p) => p.personId)));
      users = await db.select({ id: usersTable.id, username: usersTable.username, email: usersTable.email })
        .from(usersTable).where(inArray(usersTable.personId, personIds));
    }

    return <ManageCompetitorsScreen persons={persons} users={users} />;
  } catch {
    return <h3 className="mt-4 text-center">Error while fetching persons</h3>;
  }
}

export default CompetitorsPage;
