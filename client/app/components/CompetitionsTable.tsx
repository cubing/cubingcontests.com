'use client';

import Link from 'next/link';
import { ICompetition } from '@sh/interfaces';
import { getCountry, getFormattedDate } from '~/helpers/utilityFunctions';

const CompetitionsTable = async ({
  competitions,
  // If one of these is defined, the other must be defined too
  onEditCompetition,
  onPostCompResults,
}: {
  competitions: ICompetition[];
  onEditCompetition?: (competitionId: string) => void;
  onPostCompResults?: (competitionId: string) => void;
}) => {
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
                <Link href={`/competitions/${comp.competitionId}`} className="link-primary">
                  {comp.name}
                </Link>
                <p className="ms-2 text-nowrap">
                  <b>{getFormattedDate(comp.startDate, comp.endDate) || 'Error'}</b>
                </p>
              </div>
              <div className="d-flex justify-content-between">
                <div>
                  {comp.city}, <b>{getCountry(comp.countryId)}</b>
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
              {/* THIS IS DESKTOP-ONLY FOR NOW */}
              {onEditCompetition && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {competitions.map((comp: ICompetition) => (
              <tr key={comp.competitionId}>
                <td>{getFormattedDate(comp.startDate, comp.endDate) || 'Error'}</td>
                <td>
                  <Link href={`/competitions/${comp.competitionId}`} className="link-primary">
                    {comp.name}
                  </Link>
                </td>
                <td>
                  {comp.city}, <b>{getCountry(comp.countryId)}</b>
                </td>
                <td>{comp.participants || '–'}</td>
                <td>{comp.events.length || '–'}</td>
                {onEditCompetition && (
                  <td>
                    <button
                      type="button"
                      onClick={() => onEditCompetition(comp.competitionId)}
                      className="me-2 btn btn-primary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onPostCompResults(comp.competitionId)}
                      className="btn btn-success btn-sm"
                    >
                      Post Results
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CompetitionsTable;
