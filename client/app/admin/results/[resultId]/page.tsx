import ResultsSubmissionForm from "~/app/components/adminAndModerator/ResultsSubmissionForm.tsx";
import { authorizeUser } from "~/server/serverUtilityFunctions.ts";

type Props = {
  params: Promise<{ resultId: string }>;
};

async function EditResultPage({ params }: Props) {
  await authorizeUser({ permissions: { videoBasedResults: ["update"] } });
  const { resultId } = await params;

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>

      <ResultsSubmissionForm events={} result={} />;
    </section>
  )
}

export default EditResultPage;
