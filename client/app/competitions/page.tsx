import myFetch from '~/helpers/myFetch';
import CompetitionsTable from '@c/CompetitionsTable';
import ICompetition from '@sh/interfaces/Competition';

export const metadata = {
  title: 'Contest Results | Deni\'s Site',
  description: 'A place for posting results from Rubik\'s cube meetups.',
  metadataBase: new URL('https://denimintsaev.com'),
  openGraph: {
    images: ['/projects/contest_results.jpg'],
  },
};

const Competitions = async () => {
  const competitions: ICompetition[] = await myFetch.get('/competitions', { revalidate: 600 });

  return (
    <>
      <h2 className="mb-5 text-center">All contests</h2>
      <CompetitionsTable competitions={competitions} />
    </>
  );
};

export default Competitions;
