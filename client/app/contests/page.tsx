import { IContestInfo, } from '@sh/WCIF';

import ContestRow from '@/components/ContestRow';

export const metadata = {
  title: 'Contest Results | Deni\'s Site',
  description: 'A place for posting results from Rubik\'s cube meetups.',
  openGraph: {
    images: ['https://denimintsaev.com/projects/contest_results.jpg',],
  },
};

const fetchContestsInfo = async (): Promise<IContestInfo[]> => {
  const res = await fetch('http://localhost:5000/api/contests');
  const json = await res.json();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return json.contestsInfo;
};

const Contests = async () => {
  const contestsInfo: IContestInfo[] = await fetchContestsInfo();

  return (
    <>
      <h2 className="mb-5 text-center">All contests</h2>
      <div className="flex-grow-1 table-responsive">
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Name</th>
              <th scope="col">Place</th>
              <th scope="col">Participants</th>
              <th scope="col">Events</th>
            </tr>
          </thead>
          <tbody>
            {contestsInfo.map((contest) => (
              <ContestRow key={contest.id} contest={contest} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Contests;
