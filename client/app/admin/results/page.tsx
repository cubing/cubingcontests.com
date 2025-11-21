import { inArray } from "drizzle-orm";
import { db } from "~/server/db/provider.ts";
import { personsTable } from "~/server/db/schema/persons.ts";
import type { FullResult } from "~/server/db/schema/results.ts";
import { authorizeUser, getRecordConfigs } from "~/server/serverUtilityFunctions.ts";
import ManageResultsScreen from "./ManageResultsScreen.tsx";

async function ManageResultsPage() {
  await authorizeUser({ permissions: { videoBasedResults: ["approve"] } });

  const recordConfigs = await getRecordConfigs("video-based-results");
  const results = (await db.query.results.findMany({
    // with: { event: true, persons: true },
    with: { event: true },
    where: { competitionId: { isNull: true } },
    orderBy: { createdAt: "desc" },
  })) as FullResult[];

  // This is a temporary hack until I figure out how to populate the persons in the first query directly
  const allPersonIds = new Set<number>();
  for (const r of results) for (const pid of r.personIds) allPersonIds.add(pid);
  const persons = await db
    .select()
    .from(personsTable)
    .where(inArray(personsTable.personId, Array.from(allPersonIds)));
  results.forEach((r) => {
    (r as any).persons = r.personIds.map((pid) => persons.find((p) => p.personId === pid) ?? null);
  });

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>

      <ManageResultsScreen results={results} recordConfigs={recordConfigs} />
    </section>
  );
}

export default ManageResultsPage;
