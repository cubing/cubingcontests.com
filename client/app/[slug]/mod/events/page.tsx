import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { authorizeUser, getEvents, getSettingFromDb } from "~/server/server-only-functions/server-only-functions.ts";
import ConfigureEventsScreen from "./ConfigureEventsScreen.tsx";

async function ConfigureEventsPage() {
  const { organization } = await authorizeUser({ useOrganization: true, orgPermissions: { events: ["create"] } });

  const [events, videoBasedResultsEnabled] = await Promise.all([
    getEvents({ organizationId: organization!.id, columns: "all", includeHiddenAndRemoved: true }),
    getSettingFromDb({ key: "video-based-results-enabled", organizationId: organization!.id }),
  ]);

  return (
    <section>
      <h2 className="mb-4 text-center">Events</h2>

      <ToastMessages className="mx-2" />

      <ConfigureEventsScreen events={events} videoBasedResultsEnabled={videoBasedResultsEnabled === "true"} />
    </section>
  );
}

export default ConfigureEventsPage;
