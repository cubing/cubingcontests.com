import { authorizeUser, getActiveRecordConfigs } from "~/server/serverUtilityFunctions.ts";
import ManageResultsScreen from "./ManageResultsScreen.tsx";
import { db } from "~/server/db/provider.ts";
import { FullResult } from "~/server/db/schema/results.ts";

async function ManageResultsPage() {
  await authorizeUser({ permissions: { videoBasedResults: ["approve"] } });

  const results = await db.query.results.findMany({
    // with: { event: true, persons: true },
    with: { event: true },
    where: { competitionId: { isNull: true } },
    orderBy: { createdAt: "desc" },
  }) as FullResult[];
  // This is a temporary hack until I figure out how to populate the persons in the first query directly
  results.forEach(async (r) => {
    const persons = await db.query.persons.findMany({ where: { personId: { in: r.personIds } } });
    const sortedPersons = r.personIds.map((pid) => persons.find((p) => p.personId === pid) ?? null);
    (r as any).persons = sortedPersons;
  });
  const activeRecordConfigs = await getActiveRecordConfigs("video-based-results");

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>

      <ManageResultsScreen results={results} activeRecordConfigs={activeRecordConfigs} />
    </section>
  );
}

export default ManageResultsPage;
