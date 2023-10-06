import myFetch from '~/helpers/myFetch';
import ContestLayout from '@c/ContestLayout';
import ContestResults from '@c/ContestResults';
import C from '@sh/constants';

const ContestResultsPage = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: C.contestResultsRev });
  if (!contestData) return <h3 className="mt-4 text-center">Contest not found</h3>;

  return (
    <ContestLayout contest={contestData.contest} activeTab="results">
      <ContestResults
        contest={contestData.contest}
        persons={contestData.persons}
        activeRecordTypes={contestData.activeRecordTypes}
      />
    </ContestLayout>
  );
};

export default ContestResultsPage;
