import { getTabs } from "~/app/[slug]/mod/events/tabs.ts";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { db } from "~/server/db/provider.ts";
import { authorizeUser, getEvents, getSettingFromDb } from "~/server/server-only-functions/server-only-functions.ts";
import ConfigureEventsScreen from "./ConfigureEventsScreen.tsx";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function ConfigureEventsPage({ params }: Props) {
  const { slug } = await params;
  const { organization } = await authorizeUser({ useOrganization: true, orgPermissions: { events: ["create"] } });

  const [events, eventCategories, videoBasedResultsEnabled] = await Promise.all([
    getEvents({ organizationId: organization!.id, columns: "all", includeHiddenAndRemoved: true }),
    db.query.eventCategories.findMany({ where: { organizationId: organization!.id }, orderBy: { rank: "asc" } }),
    getSettingFromDb({ key: "video-based-results-enabled", organizationId: organization!.id }),
  ]);

  return (
    <>
      <Tabs tabs={getTabs(slug)} activeTab="events" forServerSidePage />

      <ConfigureEventsScreen
        events={events}
        eventCategories={eventCategories}
        videoBasedResultsEnabled={videoBasedResultsEnabled === "true"}
      />
    </>
  );
}

export default ConfigureEventsPage;
