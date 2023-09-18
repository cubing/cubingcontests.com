import myFetch from '~/helpers/myFetch';
import ContestLayout from '@c/ContestLayout';
import ContestResults from '@c/ContestResults';

const ContestResultsPage = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 30 });
  if (!contestData) return <h3 className="mt-4 text-center">Contest not found</h3>;

  return (
    <ContestLayout contest={contestData.contest} activeTab="results">
      <ContestResults contestData={contestData} />
    </ContestLayout>
  );
};

export default ContestResultsPage;
