import myFetch from '~/helpers/myFetch';
import ContestLayout from '@c/ContestLayout';
import CompetitionResults from '@c/CompetitionResults';

const CompetitionResultsPage = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 30 });
  if (!contestData) return <h3 className="mt-4 text-center">Contest not found</h3>;

  return (
    <ContestLayout competition={contestData.competition} activeTab="results">
      <CompetitionResults contestData={contestData} />
    </ContestLayout>
  );
};

export default CompetitionResultsPage;
