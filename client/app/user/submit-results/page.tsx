import ResultsSubmissionForm from "~/app/components/adminAndModerator/ResultsSubmissionForm.tsx";
import { authorizeUser, getActiveRecordConfigs, getWrPairs } from "~/server/serverUtilityFunctions.ts";
import { db } from "~/server/db/provider.ts";
import { eq } from "drizzle-orm";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";

async function SubmitResultsPage() {
  await authorizeUser({ permissions: { videoBasedResults: ["create"] } });

  const events = await db.select(eventsPublicCols).from(eventsTable).where(eq(eventsTable.submissionsAllowed, true))
    .orderBy(eventsTable.rank);
  const activeRecordConfigs = await getActiveRecordConfigs("video-based-results");
  const wrPairs = await getWrPairs();

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>

      <ResultsSubmissionForm
        events={events}
        wrPairs={wrPairs}
        activeRecordConfigs={activeRecordConfigs}
      />
    </section>
  );
}

export default SubmitResultsPage;
