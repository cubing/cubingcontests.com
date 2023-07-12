import myFetch from '~/helpers/myFetch';
import CompetitionsTable from '@c/CompetitionsTable';
import { ICompetition } from '@sh/interfaces';

const Competitions = async () => {
  const { payload: competitions } = await myFetch.get('/competitions', { revalidate: 100 });

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
