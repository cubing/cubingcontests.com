import myFetch from '~/helpers/myFetch';
import CompetitionResults from '@c/CompetitionResults';

const Competition = async ({ params }: { params: { id: string } }) => {
  const { payload: competitionData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 30 });

  if (competitionData) {
    return (
      <>
        <h2 className="text-center lh-base">{competitionData.competition.name}</h2>
        {competitionData.competition && <CompetitionResults data={competitionData} />}
      </>
    );
  } else {
    return <h3 className="mt-4 text-center">Competition not found</h3>;
  }
};

export default Competition;
