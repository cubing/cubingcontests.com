import { Suspense } from "react";
import { SWRConfig } from "swr";
import ManagePersonsScreen from "~/app/[slug]/mod/competitors/ManagePersonsScreen.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { auth } from "~/server/auth.ts";
import { getPersonProfilesSF } from "~/server/server-functions/person-server-functions.ts";
import {
  authorizeUser,
  getCreators,
  getRegions,
  getSettingFromDb,
} from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function CompetitorsPage({ params }: Props) {
  const { slug } = await params;
  const { user, member, organization, httpHeaders } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { persons: ["create", "update", "delete"] },
  });

  const [{ success: canApprovePersons }, personsDataRes, regions, spaceType] = await Promise.all([
    auth.api.hasPermission({ headers: httpHeaders, body: { permissions: { persons: ["approve"] } } }),
    getPersonProfilesSF({ slug }),
    getRegions(organization!.id),
    getSettingFromDb({ key: "space-type", organizationId: organization!.id }),
  ]);

  if (!personsDataRes.data) return <LoadingError loadingEntity="persons" />;

  const personsData = personsDataRes.data;
  const userIds = Array.from(new Set(personsData.entries.filter((p) => p.createdBy !== null).map((p) => p.createdBy!)));
  const creators = await getCreators({ organizationId: organization!.id, userIds, includeEmails: canApprovePersons });

  // Add current user to creators list, if they've not created any persons yet
  if (!creators.some((c) => c.userId === user.id)) {
    const creatorPerson = member?.personId ? (personsData.entries.find((p) => p.id === member.personId) ?? null) : null;
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
          <ManagePersonsScreen personsData={personsData} creators={creators} />
        </Suspense>
      </SWRConfig>
    </section>
  );
}

export default CompetitorsPage;
