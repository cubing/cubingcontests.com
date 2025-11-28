import { eq } from "drizzle-orm";
import ResultsSubmissionForm from "~/app/components/adminAndModerator/ResultsSubmissionForm.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import { resultsTable as table } from "~/server/db/schema/results.ts";
import { authorizeUser, getRecordConfigs, getVideoBasedEvents } from "~/server/serverUtilityFunctions.ts";

type Props = {
  params: Promise<{ resultId: string }>;
};

async function EditResultPage({ params }: Props) {
  await authorizeUser({ permissions: { videoBasedResults: ["update"] } });
  const { resultId } = await params;

  const events = await getVideoBasedEvents();
  const recordConfigs = await getRecordConfigs("video-based-results");
  const [result] = await db
    .select()
    .from(table)
    .where(eq(table.id, Number(resultId)));

  if (!result) return <LoadingError />;

  return (
    <section>
      <ResultsSubmissionForm
        events={events}
        recordConfigs={recordConfigs}
        result={result}
        competitors={undefined}
        creator={undefined}
        creatorPerson={undefined}
      />
    </section>
  );
}

export default EditResultPage;
