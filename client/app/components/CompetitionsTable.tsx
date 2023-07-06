'use client';

import Link from 'next/link';
import { ICompetition } from '@sh/interfaces';
import { getCountry } from '~/helpers/utilityFunctions';

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
    <>
      {/* MOBILE VIEW */}
      <div className="d-block d-lg-none border-top border-bottom">
        <ul className="list-group list-group-flush">
          {competitions.map((comp: ICompetition, index: number) => (
            <li
              key={comp.competitionId}
              className={'list-group-item list-group-item-action' + (index % 2 === 1 ? ' list-group-item-dark' : '')}
            >
              <div className="d-flex justify-content-between mb-2">
                <Link href={getLink(comp.competitionId)} className="link-primary">
                  {comp.name}
                </Link>
                <p className="ms-2 text-nowrap">
                  <b>{getFormattedDate(comp.startDate, comp.endDate) || 'Error'}</b>
                </p>
              </div>
              <div className="d-flex justify-content-between">
                <div>
                  {comp.city}, <b>{getCountry(comp)}</b>
                </div>
                {comp.events.length > 0 && (
                  <div className="ms-3 text-end">
                    Participants:&nbsp;<b>{comp.participants}</b>, Events:&nbsp;<b>{comp.events.length}</b>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* DESKTOP VIEW */}
      <div className="d-none d-lg-block flex-grow-1 table-responsive">
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
                  {comp.city}, <b>{getCountry(comp)}</b>
                </td>
                <td>{comp.participants || '–'}</td>
                <td>{comp.events.length || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CompetitionsTable;
