import { inArray } from "drizzle-orm";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import ManageMembersScreen from "~/app/[slug]/mod/members/ManageMembersScreen.tsx";
import { getTabs } from "~/app/[slug]/mod/members/tabs.ts";
import Loading from "~/app/components/UI/Loading.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { db } from "~/server/db/provider.ts";
import { personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { authorizeUser, getRegions, getSettingFromDb } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function ManageMembersPage({ params }: Props) {
  const { slug } = await params;
  const { organization } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { member: ["create", "update", "delete"] },
  });

  const [members, regions, spaceType, videoBasedResultsEnabled] = await Promise.all([
    db.query.members.findMany({
      with: { user: { columns: { id: true, name: true, email: true } } },
      columns: { id: true, organizationId: true, userId: true, role: true, personId: true, createdAt: true },
      where: { organizationId: organization!.id },
      orderBy: { createdAt: "desc" },
    }),
    getRegions(organization!.id),
    getSettingFromDb({ key: "space-type", organizationId: organization!.id }),
    getSettingFromDb({ key: "video-based-results-enabled", organizationId: organization!.id }),
  ]);

  const personIds = Array.from(new Set(members.filter((m) => m.personId).map((m) => m.personId!)));
  const persons = await db.select(personsPublicCols).from(personsTable).where(inArray(personsTable.id, personIds));

  return (
    <>
      <Tabs tabs={getTabs(slug)} activeTab="members" forServerSidePage />

      <SWRConfig
        value={{
          fallback: {
            [SwrKey.SpaceType]: spaceType,
            [SwrKey.Regions]: regions,
          },
        }}
      >
        <Suspense fallback={<Loading />}>
          <ManageMembersScreen
            members={members as any}
            memberPersons={persons}
            videoBasedResultsEnabled={videoBasedResultsEnabled === "true"}
          />
        </Suspense>
      </SWRConfig>
    </>
  );
}

export default ManageMembersPage;
