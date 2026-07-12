import { inArray } from "drizzle-orm";
import Markdown from "react-markdown";
import { db } from "~/server/db/provider.ts";
import { personsTable } from "~/server/db/schema/persons.ts";
import type { FullResult } from "~/server/db/schema/results.ts";
import {
  authorizeUser,
  getEvents,
  getRecordConfigs,
  getRegions,
  getSettingFromDb,
} from "~/server/server-only-functions/server-only-functions.ts";
import ManageResultsScreen from "./ManageResultsScreen.tsx";

async function ManageResultsPage() {
  const { organization } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { videoBasedResults: ["update", "approve", "delete"] },
  });

  const [results, events, recordConfigs, regions, videoBasedResultsEnabled, instructions] = await Promise.all([
    db.query.results.findMany({
      where: { organizationId: organization!.id, competitionId: { isNull: true } },
      orderBy: { createdAt: "desc" },
    }),
    getEvents({ organizationId: organization!.id, includeHiddenAndRemoved: true }),
    getRecordConfigs(organization!.id, { recordCategory: "online" }),
    getRegions(organization!.id),
    getSettingFromDb({ key: "video-based-results-enabled", organizationId: organization!.id }),
    getSettingFromDb({ key: "video-based-results-instructions", organizationId: organization!.id }),
  ]);

  if (videoBasedResultsEnabled !== "true")
    return <p className="fs-4 mx-3 mt-5 text-center">Video-based results are disabled</p>;

  const allPersonIds = new Set<number>();
  for (const r of results) for (const pid of r.personIds) allPersonIds.add(pid);
  const persons = await db
    .select()
    .from(personsTable)
    .where(inArray(personsTable.id, Array.from(allPersonIds)));
  results.forEach((r) => {
    (r as any).persons = r.personIds.map((pid) => persons.find((p) => p.id === pid) ?? null);
  });

  return (
    <section>
      <div className="mb-4 px-2">
        <h2 className="mb-4 text-center">Results</h2>

        <div className="lh-lg overflow-y-auto border p-2" style={{ maxHeight: "300px" }}>
          <Markdown>{instructions}</Markdown>
        </div>
      </div>

      <ManageResultsScreen
        results={results as FullResult[]}
        events={events}
        recordConfigs={recordConfigs}
        regions={regions}
      />
    </section>
  );
}

export default ManageResultsPage;
