import Link from 'next/link';
import ICompetition from '@sh/interfaces/Competition';
import Countries from '@sh/Countries';

const getFormattedDate = (start: Date, end: Date): string => {
  if (!start || !end) throw new Error('Dates missing!');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate.toString() === endDate.toString()) {
    return `${months[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()}`;
  } else {
    return 'Not implemented';
  }
};

const CompetitionsTable = async ({
  competitions,
  linkToPostResults = false,
}: {
  competitions: ICompetition[];
  linkToPostResults?: boolean;
}) => {
  const getLink = (competitionId: string): string => {
    if (linkToPostResults) {
      return `/admin/competition/${competitionId}`;
    } else {
      return `/competitions/${competitionId}`;
    }
  };

  return (
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
                <Link href={getLink(comp.competitionId)} className="link-primary">
                  {comp.name}
                </Link>
              </td>
              <td>
                {comp.city}, {Countries.find((el) => el.code === comp.countryId)?.name}
              </td>
              <td>{comp.participants || '–'}</td>
              <td>{comp.events?.length || '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompetitionsTable;
