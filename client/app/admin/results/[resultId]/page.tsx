import ResultsSubmissionForm from '~/app/components/adminAndModerator/ResultsSubmissionForm.tsx';

const EditResultPage = ({ params }: { params: { resultId: string } }) => {
  return <ResultsSubmissionForm resultId={params.resultId} />;
};

export default EditResultPage;
