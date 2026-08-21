import { Suspense } from "react";
import { SWRConfig } from "swr";
import ManagePersonsScreen from "~/app/[slug]/mod/competitors/ManagePersonsScreen.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { auth } from "~/server/auth.ts";
import type { SelectPerson } from "~/server/db/schema/persons.ts";
import { getPersonProfilesSF } from "~/server/server-functions/person-server-functions.ts";
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

  const [{ success: canApprovePersons }, personsRes, regions, spaceType] = await Promise.all([
    auth.api.hasPermission({ headers: httpHeaders, body: { permissions: { persons: ["approve"] } } }),
    getPersonProfilesSF({}),
    getRegions(organization!.id),
    getSettingFromDb({ key: "space-type", organizationId: organization!.id }),
  ]);

  if (!personsRes.data) return <LoadingError loadingEntity="persons" />;

  const persons = personsRes.data;
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
      <h2 className="mb-4 text-center">Manage Persons</h2>

      <SWRConfig
        value={{
          fallback: {
            [SwrKey.SpaceType]: spaceType,
            [SwrKey.Regions]: regions,
          },
        }}
      >
        <Suspense fallback={<Loading />}>
          <ManagePersonsScreen persons={persons} creators={creators} />
        </Suspense>
      </SWRConfig>
    </section>
  );
}

export default CompetitorsPage;
