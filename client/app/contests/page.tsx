import Link from 'next/link';
import ICompetition from '@sh/interfaces/Competition';

export const metadata = {
  title: 'Contest Results | Deni\'s Site',
  description: 'A place for posting results from Rubik\'s cube meetups.',
  openGraph: {
    images: ['https://denimintsaev.com/projects/contest_results.jpg'],
  },
};

const fetchCompetitions = async (): Promise<ICompetition[]> => {
  try {
    const res = await fetch('http://127.0.0.1:4000/competitions', {
      next: {
        revalidate: 300,
      },
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

const getFormattedDate = (start: Date, end: Date): string => {
  if (!start || !end) throw new Error('Dates missing!');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate.toString() === endDate.toString()) {
    console.log(typeof startDate);
    return `${months[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()}`;
  } else {
    return 'Not implemented';
  }
};

const Contests = async () => {
  const competitions: ICompetition[] = await fetchCompetitions();

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
            {competitions.map((comp: ICompetition) => (
              <tr key={comp.competitionId}>
                <td>{getFormattedDate(comp.startDate, comp.endDate) || 'Error'}</td>
                <td>
                  <Link href={'/contests/' + comp.competitionId} className="link-primary">
                    {comp.name}
                  </Link>
                </td>
                <td>
                  {comp.city}, {comp.countryId}
                </td>
                <td>{comp.participants || '–'}</td>
                <td>{comp.events?.length || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Contests;
