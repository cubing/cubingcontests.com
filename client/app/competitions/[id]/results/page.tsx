import myFetch from '~/helpers/myFetch';
import CompetitionLayout from '@c/CompetitionLayout';
import CompetitionResults from '@c/CompetitionResults';

const CompetitionResultsPage = async ({ params }: { params: { id: string } }) => {
  const { payload: competitionData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 30 });
  if (!competitionData) return <h3 className="mt-4 text-center">Competition not found</h3>;

  return (
    <CompetitionLayout competition={competitionData.competition} activeTab="results">
      <CompetitionResults competitionData={competitionData} />
    </CompetitionLayout>
  );
};

export default CompetitionResultsPage;
