import Link from 'next/link';
import { ICompetition } from '@sh/interfaces';
import { getCountry, getFormattedDate } from '~/helpers/utilityFunctions';
import { CompetitionState, CompetitionType, Role } from '@sh/enums';
import ContestTypeBadge from './ContestTypeBadge';

const CompetitionsTable = async ({
  competitions,
  // If one of these is defined, the other must be defined too
  onEditCompetition,
  onCopyCompetition,
  onPostCompResults,
  onChangeCompState,
  role,
}: {
  competitions: ICompetition[];
  onEditCompetition?: (competitionId: string) => void;
  onCopyCompetition?: (competitionId: string) => void;
  onPostCompResults?: (competitionId: string) => void;
  onChangeCompState?: (competitionId: string, newState: CompetitionState) => void;
  role?: Role; // used on the admin dashboard
}) => {
  return (
    <>
      {/* MOBILE VIEW */}

      <div className="d-block d-lg-none border-top border-bottom">
        <ul className="list-group list-group-flush">
          {competitions.map((comp: ICompetition, index: number) => (
            <li
              key={comp.competitionId}
              className={'list-group-item' + (index % 2 === 1 ? ' list-group-item-dark' : '')}
            >
              <div className="d-flex justify-content-between mb-2">
                <Link href={`/competitions/${comp.competitionId}`} className="link-primary">
                  {comp.name}
                </Link>
                <p className="ms-2 text-nowrap">
                  <b>{getFormattedDate(comp.startDate, comp.endDate)}</b>
                </p>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <div>
                  {comp.type !== CompetitionType.Online ? (
                    <>
                      {comp.city}, <b>{getCountry(comp.countryIso2)}</b>
                    </>
                  ) : (
                    <>Online</>
                  )}
                </div>
                <div className="text-end">
                  {comp.participants > 0 && (
                    <span>
                      Participants:&nbsp;<b>{comp.participants}</b>
                      {', '}
                    </span>
                  )}
                  Events:&nbsp;<b>{comp.events.length}</b>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* DESKTOP VIEW (includes admin/moderator-only features) */}

      <div className="d-none d-lg-block flex-grow-1 mb-5 table-responsive">
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Name</th>
              <th scope="col">Place</th>
              <th scope="col">Type</th>
              <th scope="col">Participants</th>
              <th scope="col">Events</th>
              {/* THIS IS DESKTOP-ONLY */}
              {onEditCompetition && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {competitions.map((comp: ICompetition) => (
              <tr key={comp.competitionId}>
                <td>{getFormattedDate(comp.startDate, comp.endDate)}</td>
                <td>
                  <Link href={`/competitions/${comp.competitionId}`} className="link-primary">
                    {comp.name}
                  </Link>
                </td>
                <td>
                  {comp.type !== CompetitionType.Online && (
                    <>
                      {comp.city}, <b>{getCountry(comp.countryIso2)}</b>
                    </>
                  )}
                </td>
                <td>
                  <ContestTypeBadge type={comp.type} />
                </td>
                <td>{comp.participants || ''}</td>
                <td>{comp.events.length}</td>
                {/* THIS IS DESKTOP-ONLY */}
                {onEditCompetition && (
                  <>
                    <td className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEditCompetition(comp.competitionId)}
                        className="btn btn-primary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopyCompetition(comp.competitionId)}
                        className="btn btn-primary btn-sm"
                      >
                        Copy
                      </button>
                      {comp.state === CompetitionState.Created && role === Role.Admin && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(comp.competitionId, CompetitionState.Approved)}
                          className="btn btn-warning btn-sm"
                        >
                          Approve
                        </button>
                      )}
                      {[CompetitionState.Approved, CompetitionState.Ongoing].includes(comp.state) && (
                        <button
                          type="button"
                          onClick={() => onPostCompResults(comp.competitionId)}
                          className="btn btn-success btn-sm"
                        >
                          Enter Results
                        </button>
                      )}
                      {comp.state === CompetitionState.Ongoing && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(comp.competitionId, CompetitionState.Finished)}
                          className="btn btn-warning btn-sm"
                        >
                          Finish
                        </button>
                      )}
                      {comp.state === CompetitionState.Finished && role === Role.Admin && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(comp.competitionId, CompetitionState.Published)}
                          className="btn btn-warning btn-sm"
                        >
                          Publish
                        </button>
                      )}
                    </td>
                  </>
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
