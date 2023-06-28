import myFetch from '~/helpers/myFetch';
import CompetitionForm from '~/app/components/CompetitionForm';
import IEvent from '@sh/interfaces/Event';

const fetchEvents = async (): Promise<IEvent[]> => {
  return await myFetch.get('/events');
};

const AdminCompetition = async () => {
  const events: IEvent[] = await fetchEvents();

  return (
    <>
      <h2 className="mb-4 text-center">Create New Competition</h2>
      <CompetitionForm events={events} />
    </>
  );
};

export default AdminCompetition;
