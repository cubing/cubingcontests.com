import { Suspense } from "react";
import OrganizationInvitationsScreen from "~/app/[slug]/mod/members/invitations/OrganizationInvitationsScreen.tsx";
import { getTabs } from "~/app/[slug]/mod/members/tabs.ts";
import Loading from "~/app/components/UI/Loading.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { authorizeUser } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function InvitationsPage({ params }: Props) {
  const { slug } = await params;
  await authorizeUser({ useOrganization: true, orgPermissions: { invitation: ["create"] } });

  return (
    <>
      <Tabs tabs={getTabs(slug)} activeTab="invitations" forServerSidePage />

      <Suspense fallback={<Loading />}>
        <OrganizationInvitationsScreen />
      </Suspense>
    </>
  );
}

export default InvitationsPage;
