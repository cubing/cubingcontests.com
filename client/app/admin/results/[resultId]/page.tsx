import ResultsSubmissionForm from '@c/adminAndModerator/ResultsSubmissionForm';

const EditResultPage = ({ params }: { params: { resultId: string } }) => {
  return <ResultsSubmissionForm resultId={params.resultId} />;
};

export default EditResultPage;
