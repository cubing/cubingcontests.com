import myFetch from '~/helpers/myFetch';
import CompetitionsTable from '@c/CompetitionsTable';
import ICompetition from '@sh/interfaces/Competition';

const Competitions = async () => {
  const competitions: ICompetition[] = await myFetch.get('/competitions', { revalidate: 600 });

  return (
    <>
      <h2 className="mb-4 text-center">All contests</h2>
      {competitions?.length === 0 ? (
        <p className="mx-2 fs-5">No contests have been held yet</p>
      ) : (
        <CompetitionsTable competitions={competitions} />
      )}
    </>
  );
};

export default Competitions;
