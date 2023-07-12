import myFetch from '~/helpers/myFetch';
import CompetitionResults from '@c/CompetitionResults';

const Competition = async ({ params }: { params: { id: string } }) => {
  const { payload: competitionData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 30 });

  if (competitionData) {
    return (
      <>
        <h2 className="text-center">{competitionData.competition?.name || 'Error'}</h2>
        {competitionData.competition && <CompetitionResults data={competitionData} />}
      </>
    );
  } else {
    return <p className="text-center fs-5">Error while fetching competition data</p>;
  }
};

export default Competition;
