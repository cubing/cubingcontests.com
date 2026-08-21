import { Suspense } from "react";
import { SWRConfig } from "swr";
import MemberRequestsScreen from "~/app/[slug]/mod/members/requests/MemberRequestsScreen.tsx";
import { getTabs } from "~/app/[slug]/mod/members/tabs.ts";
import Loading from "~/app/components/UI/Loading.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { db } from "~/server/db/provider.ts";
import { authorizeUser, getRegions } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function MemberRequestsPage({ params }: Props) {
  const { slug } = await params;
  const { organization } = await authorizeUser({ useOrganization: true, orgPermissions: { memberRequests: ["list"] } });

  const [memberRequests, regions] = await Promise.all([
    db.query.memberRequests.findMany({
      with: {
        user: { columns: { id: true, name: true, email: true } },
        requestedPerson: true,
      },
      where: { member: { organizationId: organization!.id } },
    }),
    getRegions(organization!.id),
  ]);

  return (
    <>
      <Tabs tabs={getTabs(slug)} activeTab="member-requests" forServerSidePage />

      <SWRConfig value={{ fallback: { [SwrKey.Regions]: regions } }}>
        <Suspense fallback={<Loading />}>
          <MemberRequestsScreen memberRequests={memberRequests} />
        </Suspense>
      </SWRConfig>
    </>
  );
}

export default MemberRequestsPage;
