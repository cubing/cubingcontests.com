import CompetitionsTable from '../components/CompetitionsTable';

export const metadata = {
  title: 'Contest Results | Deni\'s Site',
  description: 'A place for posting results from Rubik\'s cube meetups.',
  metadataBase: new URL('https://denimintsaev.com'),
  openGraph: {
    images: ['/projects/contest_results.jpg'],
  },
};

const Contests = async () => {
  return (
    <>
      <h2 className="mb-5 text-center">All contests</h2>
      <CompetitionsTable revalidate={600} />
    </>
  );
};

export default Contests;
