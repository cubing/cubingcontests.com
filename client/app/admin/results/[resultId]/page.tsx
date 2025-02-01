import ResultsSubmissionForm from "~/app/components/adminAndModerator/ResultsSubmissionForm.tsx";

type Props = {
  params: Promise<{ resultId: string }>;
};

const EditResultPage = async ({ params }: Props) => {
  const { resultId } = await params;

  return <ResultsSubmissionForm resultId={resultId} />;
};

export default EditResultPage;
