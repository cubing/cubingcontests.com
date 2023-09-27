import Link from 'next/link';
import { IContest } from '@sh/interfaces';
import { getFormattedDate } from '~/helpers/utilityFunctions';
import { ContestState, ContestType } from '@sh/enums';
import ContestTypeBadge from './ContestTypeBadge';
import Country from './Country';

const ContestsTable = async ({
  contests,
  modView = false,
  // If one of these is defined, the other must be defined too
  onEditCompetition,
  onCopyCompetition,
  onPostCompResults,
  onChangeCompState,
  isAdmin = false,
}: {
  contests: IContest[];
  modView?: boolean;
  onEditCompetition?: (competitionId: string) => void;
  onCopyCompetition?: (competitionId: string) => void;
  onPostCompResults?: (competitionId: string) => void;
  onChangeCompState?: (competitionId: string, newState: ContestState) => void;
  isAdmin?: boolean; // used on the admin dashboard
}) => {
  return (
    <>
      {/* MOBILE VIEW */}

      {!modView && (
        <div className="d-block d-lg-none border-top border-bottom">
          <ul className="list-group list-group-flush">
            {contests.map((contest: IContest, index: number) => (
              <li
                key={contest.competitionId}
                className={`list-group-item` + (index % 2 === 1 ? ` list-group-item-dark` : ``)}
              >
                <div className="d-flex justify-content-between mb-2">
                  <Link href={`/competitions/${contest.competitionId}`} className="link-primary">
                    {contest.name}
                  </Link>
                  <p className="ms-2 text-nowrap">
                    <b>{getFormattedDate(contest.startDate, contest.endDate)}</b>
                  </p>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    {contest.type !== ContestType.Online ? (
                      <>
                        {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions />
                      </>
                    ) : (
                      <>Online</>
                    )}
                  </div>
                  <div className="text-end">
                    {contest.participants > 0 && (
                      <span>
                        Participants:&nbsp;<b>{contest.participants}</b>
                        {`, `}
                      </span>
                    )}
                    Events:&nbsp;<b>{contest.events.length}</b>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DESKTOP VIEW (includes admin/moderator-only features) */}

      <div className={`${!modView && 'd-none d-lg-block'} flex-grow-1 mb-5 table-responsive`}>
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
            {contests.map((contest: IContest) => (
              <tr key={contest.competitionId}>
                <td>{getFormattedDate(contest.startDate, contest.endDate)}</td>
                <td>
                  <Link href={`/competitions/${contest.competitionId}`} className="link-primary">
                    {contest.name}
                  </Link>
                </td>
                <td>
                  {contest.type !== ContestType.Online && (
                    <span>
                      {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions />
                    </span>
                  )}
                </td>
                <td>
                  <ContestTypeBadge type={contest.type} />
                </td>
                <td>{contest.participants || ``}</td>
                <td>{contest.events.length}</td>

                {/* THIS IS DESKTOP-ONLY */}
                {onEditCompetition && (
                  <td className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEditCompetition(contest.competitionId)}
                      className="btn btn-primary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onCopyCompetition(contest.competitionId)}
                      className="btn btn-primary btn-sm"
                    >
                      Clone
                    </button>
                    {contest.state === ContestState.Created &&
                      isAdmin &&
                      (contest.type !== ContestType.Competition || contest.compDetails) && (
                      <button
                        type="button"
                        onClick={() => onChangeCompState(contest.competitionId, ContestState.Approved)}
                        className="btn btn-warning btn-sm"
                      >
                          Approve
                      </button>
                    )}
                    {[ContestState.Approved, ContestState.Ongoing].includes(contest.state) && (
                      <button
                        type="button"
                        onClick={() => onPostCompResults(contest.competitionId)}
                        className="btn btn-sm btn-success"
                      >
                        Enter Results
                      </button>
                    )}
                    {contest.state > ContestState.Ongoing && isAdmin && (
                      <button
                        type="button"
                        onClick={() => onPostCompResults(contest.competitionId)}
                        className="btn btn-sm btn-secondary"
                      >
                        Edit Results
                      </button>
                    )}
                    {contest.state === ContestState.Ongoing && (
                      <button
                        type="button"
                        onClick={() => onChangeCompState(contest.competitionId, ContestState.Finished)}
                        className="btn btn-warning btn-sm"
                      >
                        Finish
                      </button>
                    )}
                    {contest.state === ContestState.Finished && isAdmin && (
                      <button
                        type="button"
                        onClick={() => onChangeCompState(contest.competitionId, ContestState.Published)}
                        className="btn btn-warning btn-sm"
                      >
                        Publish
                      </button>
                    )}
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

export default ContestsTable;
