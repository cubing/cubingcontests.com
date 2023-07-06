import myFetch from '~/helpers/myFetch';
import CompetitionForm from '@c/adminAndModerator/CompetitionForm';
import { IEvent } from '@sh/interfaces';

const AdminCompetition = async () => {
  const events: IEvent[] = await myFetch.get('/events');

  return (
    <>
      <h2 className="mb-4 text-center">Create New Competition</h2>
      <CompetitionForm events={events} />
    </>
  );
};

export default AdminCompetition;
