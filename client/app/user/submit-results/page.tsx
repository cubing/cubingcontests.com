import { eq } from "drizzle-orm";
import ResultsSubmissionForm from "~/app/components/adminAndModerator/ResultsSubmissionForm.tsx";
import { db } from "~/server/db/provider.ts";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import { authorizeUser, getRecordConfigs, getWrPairs } from "~/server/serverUtilityFunctions.ts";

async function SubmitResultsPage() {
  await authorizeUser({ permissions: { videoBasedResults: ["create"] } });

  const events = await db
    .select(eventsPublicCols)
    .from(eventsTable)
    .where(eq(eventsTable.submissionsAllowed, true))
    .orderBy(eventsTable.rank);
  const recordConfigs = await getRecordConfigs("video-based-results");
  const wrPairs = await getWrPairs();

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>

      <ResultsSubmissionForm events={events} wrPairs={wrPairs} recordConfigs={recordConfigs} />
    </section>
  );
}

export default SubmitResultsPage;
