import Link from 'next/link';
import { IContestInfo } from '@sh/WCIF';
import IDate from '@sh/interfaces/Date';

export const metadata = {
  title: 'Contest Results | Deni\'s Site',
  description: 'A place for posting results from Rubik\'s cube meetups.',
  openGraph: {
    images: ['https://denimintsaev.com/projects/contest_results.jpg'],
  },
};

const fetchContestsInfo = async (): Promise<IContestInfo[]> => {
  const res = await fetch('http://localhost:5000/api/contests', {
    next: {
      revalidate: 200,
    },
  });
  const json = await res.json();
  return json.contestsInfo;
};

const getFormattedDate = (date: IDate): string => {
  if (!date) return '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${months[date.month - 1]} ${date.day}, ${date.year}`;
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
              <tr key={contest.id}>
                <td>{getFormattedDate(contest.date)}</td>
                <td>
                  <Link href={'/contests/' + contest.id} className="link-primary">
                    {contest.name}
                  </Link>
                </td>
                <td>{contest.location}</td>
                <td>{contest.participants}</td>
                <td>{contest.events}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Contests;
