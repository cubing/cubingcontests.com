import { desc, eq, inArray } from "drizzle-orm";
import ManageCompetitorsScreen from "~/app/mod/competitors/ManageCompetitorsScreen.tsx";
import type { Creator } from "~/helpers/types.ts";
import { db } from "~/server/db/provider.ts";
import { usersTable } from "~/server/db/schema/auth-schema.ts";
import {
  type PersonResponse,
  personsPublicCols,
  type SelectPerson,
  personsTable as table,
} from "~/server/db/schema/persons.ts";
import { authorizeUser, checkUserPermissions } from "~/server/serverUtilityFunctions.ts";

async function CompetitorsPage() {
  const { user } = await authorizeUser({ permissions: { persons: ["create", "update", "delete"] } });
  const isAdmin = await checkUserPermissions(user.id, { persons: ["approve"] });

  try {
    let persons: SelectPerson[] | PersonResponse[];
    let users: Creator[] | undefined;

    if (isAdmin) {
      persons = await db.select().from(table).orderBy(desc(table.personId));
      const userIds = Array.from(
        new Set(persons.filter((p: SelectPerson) => p.createdBy).map((p: SelectPerson) => p.createdBy)),
      );

      users = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email,
          personId: usersTable.personId,
        })
        .from(usersTable)
        .where(inArray(usersTable.id, userIds));
    } else {
      persons = await db
        .select(personsPublicCols)
        .from(table)
        .where(eq(table.createdBy, user.id))
        .orderBy(desc(table.personId));
    }

    return (
      <section>
        <h2 className="mb-4 text-center">Competitors</h2>

        <ManageCompetitorsScreen persons={persons} users={users} />
      </section>
    );
  } catch {
    return <h3 className="mt-4 text-center">Error while fetching persons</h3>;
  }
}

export default CompetitorsPage;
