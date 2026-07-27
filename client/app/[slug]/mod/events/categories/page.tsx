import { getTabs } from "~/app/[slug]/mod/events/tabs.ts";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { db } from "~/server/db/provider.ts";
import { authorizeUser } from "~/server/server-only-functions/server-only-functions.ts";
import ConfigureEventCategoriesScreen from "./ConfigureEventCategoriesScreen.tsx";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function ConfigureEventCategoriesPage({ params }: Props) {
  const { slug } = await params;
  const { organization } = await authorizeUser({ useOrganization: true, orgPermissions: { events: ["create"] } });

  const eventCategories = await db.query.eventCategories.findMany({
    where: { organizationId: organization!.id },
    orderBy: { rank: "asc" },
  });

  return (
    <>
      <Tabs tabs={getTabs(slug)} activeTab="categories" forServerSidePage />

      <ConfigureEventCategoriesScreen eventCategories={eventCategories} />
    </>
  );
}

export default ConfigureEventCategoriesPage;
