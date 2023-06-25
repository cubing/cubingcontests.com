import CompetitionForm from '~/app/components/CompetitionForm';
import IEvent from '@sh/interfaces/Event';

const fetchEvents = async (): Promise<IEvent[]> => {
  try {
    const res = await fetch('http://127.0.0.1:4000/events', {
      next: {
        revalidate: 600,
      },
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
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
