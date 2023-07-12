import myFetch from '~/helpers/myFetch';
import CompetitionForm from '@c/adminAndModerator/CompetitionForm';

const CreateCompetition = async () => {
  const { payload: events } = await myFetch.get('/events');

  return (
    <>
      <h2 className="mb-4 text-center">Create New Competition</h2>
      {events ? <CompetitionForm events={events} /> : <p className="text-center fs-5">Error while fetching events</p>}
    </>
  );
};

export default CreateCompetition;
