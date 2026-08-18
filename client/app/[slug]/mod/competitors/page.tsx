import { desc, eq } from "drizzle-orm";
import ManageCompetitorsScreen from "~/app/[slug]/mod/competitors/ManageCompetitorsScreen.tsx";
import type { SpaceType } from "~/helpers/types.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import { personsPublicCols, type SelectPerson, personsTable as table } from "~/server/db/schema/persons.ts";
import {
  authorizeUser,
  getCreators,
  getRegions,
  getSettingFromDb,
} from "~/server/server-only-functions/server-only-functions.ts";

async function CompetitorsPage() {
  const { user, member, organization, httpHeaders } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { persons: ["create", "update", "delete"] },
  });

  const [{ success: canApprovePersons }, regions, spaceType] = await Promise.all([
    auth.api.hasPermission({ headers: httpHeaders, body: { permissions: { persons: ["approve"] } } }),
    getRegions(organization!.id),
    getSettingFromDb({ key: "space-type", organizationId: organization!.id }),
  ]);

  const persons = await (canApprovePersons
    ? db.select()
    : db.select({ ...personsPublicCols, createdBy: table.createdBy })
  )
    .from(table)
    .where(eq(table.organizationId, organization!.id))
    .orderBy(desc(table.id));
  const userIds = Array.from(
    new Set((persons as SelectPerson[]).filter((p) => p.createdBy !== null).map((p) => p.createdBy!)),
  );
  const creators = await getCreators({ organizationId: organization!.id, userIds, includeEmails: canApprovePersons });

  // Add current user to creators list, if they've not created any persons yet
  if (!creators.some((c) => c.userId === user.id)) {
    const creatorPerson = member?.personId ? (persons.find((p) => p.id === member.personId) ?? null) : null;
    creators.push({ userId: user.id, name: user.name, email: user.email, person: creatorPerson });
  }

  return (
    <section>
      <h2 className="mb-4 text-center">Manage Competitors</h2>

      <ManageCompetitorsScreen
        persons={persons}
        regions={regions}
        creators={creators}
        spaceType={spaceType as SpaceType}
      />
    </section>
  );
}

export default CompetitorsPage;
