import ResultsSubmissionForm from "~/app/components/adminAndModerator/ResultsSubmissionForm.tsx";
import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import { eventsPublicCols, eventsTable as table } from "~/server/db/schema/events.ts";
import { db } from "~/server/db/provider.ts";
import { eq, or } from "drizzle-orm";

async function SubmitResultsPage() {
  await authorizeUser();

  const events = await db.select(eventsPublicCols).from(table).where(
    or(eq(table.category, "extreme-bld"), eq(table.submissionsAllowed, true)),
  ).orderBy(table.rank);

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>

      <ResultsSubmissionForm events={events} />;
    </section>
  );
}

export default SubmitResultsPage;
