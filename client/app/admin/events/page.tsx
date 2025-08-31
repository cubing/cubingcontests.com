import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import { db } from "~/server/db/provider.ts";
import { eventsTable as table } from "~/server/db/schema/events.ts";
import ConfigureEventsScreen from "./ConfigureEventsScreen.tsx";

async function ConfigureEventsPage() {
  await authorizeUser({ permissions: { events: ["create"] } });

  const events = await db.select().from(table).orderBy(table.rank);

  return (
    <section>
      <h2 className="mb-4 text-center">Events</h2>

      <ConfigureEventsScreen events={events} />;
    </section>
  );
}

export default ConfigureEventsPage;
