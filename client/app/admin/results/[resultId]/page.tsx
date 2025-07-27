import ResultsSubmissionForm from "~/app/components/adminAndModerator/ResultsSubmissionForm.tsx";
import { authorizeUser } from "~/server/serverUtilityFunctions.ts";

type Props = {
  params: Promise<{ resultId: string }>;
};

async function EditResultPage({ params }: Props) {
  await authorizeUser({ permissions: { videoBasedResults: ["update"] } });
  const { resultId } = await params;

  return <ResultsSubmissionForm events={} result={} />;
}

export default EditResultPage;
