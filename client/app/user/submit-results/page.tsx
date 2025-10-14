import ResultsSubmissionForm from "~/app/components/adminAndModerator/ResultsSubmissionForm.tsx";
import { authorizeUser, getWrPairs } from "~/server/serverUtilityFunctions.ts";
import { db } from "~/server/db/provider.ts";
import { eq } from "drizzle-orm";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import { recordConfigsPublicCols, recordConfigsTable } from "~/server/db/schema/record-configs.ts";

async function SubmitResultsPage() {
  await authorizeUser({ permissions: { videoBasedResults: ["create"] } });

  const events = await db.select(eventsPublicCols).from(eventsTable).where(eq(eventsTable.submissionsAllowed, true))
    .orderBy(eventsTable.rank);
  const activeRecordConfigs = await db.select(recordConfigsPublicCols).from(recordConfigsTable)
    .where(eq(recordConfigsTable.active, true));
  const eventWrPairs = await getWrPairs();

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>

      <ResultsSubmissionForm
        events={events}
        eventWrPairs={eventWrPairs}
        activeRecordConfigs={activeRecordConfigs}
      />;
    </section>
  );
}

export default SubmitResultsPage;
