import myFetch from '~/helpers/myFetch';
import CompetitionForm from '@c/adminAndModerator/CompetitionForm';

const EditCompetition = async ({ params }: { params: { id: string } }) => {
  const { payload: competitionData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 0 });
  const { payload: events } = await myFetch.get('/events');

  if (events) {
    return (
      <>
        <h2 className="mb-4 text-center">Edit Competition</h2>
        <CompetitionForm events={events} competition={competitionData.competition} />
      </>
    );
  } else {
    return <p className="text-center fs-5">Error while fetching events</p>;
  }
};

export default EditCompetition;
