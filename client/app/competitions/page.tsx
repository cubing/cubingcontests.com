import myFetch from '~/helpers/myFetch';
import ContestsTable from '@c/ContestsTable';

// SEO
export const metadata = {
  title: 'All contests | Cubing Contests',
  description: `List of unofficial Rubik's Cube competitions and speedcuber meetups.`,
  keywords: `rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle`,
  icons: { icon: '/favicon.png' },
  metadataBase: new URL('https://cubingcontests.com'),
  openGraph: {
    images: ['/api/cubing_contests_2.jpg'],
  },
};

const ContestsPage = async () => {
  const { payload: contests } = await myFetch.get('/competitions', { revalidate: 60 });

  return (
    <>
      <h2 className="mb-4 text-center">All contests</h2>

      {contests?.length > 0 ? (
        <ContestsTable contests={contests} />
      ) : (
        <p className="mx-2 fs-5">No contests have been held yet</p>
      )}
    </>
  );
};

export default ContestsPage;
