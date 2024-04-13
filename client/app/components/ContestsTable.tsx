import Link from 'next/link';
import { FaCircle } from 'react-icons/fa';
import ContestTypeBadge from '@c/ContestTypeBadge';
import Country from '@c/Country';
import { IContest } from '@sh/interfaces';
import { ContestState, ContestType } from '@sh/enums';
import C from '@sh/constants';
import { getBSClassFromColor, getFormattedDate } from '~/helpers/utilityFunctions';
import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';

const ContestsTable = ({
  contests,
  modView = false,
  // If one of these is defined, the other must be defined too
  onEditCompetition,
  onCopyCompetition,
  onPostCompResults,
  onChangeCompState,
  isAdmin = false,
  disableActions = false,
}: {
  contests: IContest[];
  modView?: boolean;
  onEditCompetition?: (competitionId: string) => void;
  onCopyCompetition?: (competitionId: string) => void;
  onPostCompResults?: (competitionId: string) => void;
  onChangeCompState?: (competitionId: string, newState: ContestState) => void;
  isAdmin?: boolean; // used on the admin dashboard
  disableActions?: boolean;
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
                className={`list-group-item ps-2 ${index % 2 === 1 ? ' list-group-item-dark' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <FaCircle
                      className={`text-${getBSClassFromColor(
                        contestTypeOptions.find((el) => el.value === contest.type).color,
                      )}`}
                      style={{ minWidth: '0.5rem', width: '0.5rem' }}
                    />

                    <Link href={`/competitions/${contest.competitionId}`} prefetch={false} className="link-primary">
                      {contest.name}
                    </Link>
                  </div>

                  <p className="ms-2 mb-0 text-end">
                    <b>{getFormattedDate(contest.startDate, contest.endDate)}</b>
                  </p>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <div className="ms-2">
                    {contest.type !== ContestType.Online ? (
                      <span>
                        {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions shorten />
                      </span>
                    ) : (
                      'Online'
                    )}
                  </div>
                  <div className="flex-shrink-0 text-end">
                    {contest.participants > 0 && (
                      <span>
                        Participants: <b>{contest.participants}</b>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DESKTOP/MOD DASHBOARD VIEW (includes admin/moderator-only features) */}

      <div className={`${!modView && 'd-none d-lg-block'} mb-5 table-responsive`}>
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Name</th>
              <th scope="col">Place</th>
              <th scope="col">Type</th>
              <th scope="col">{onEditCompetition ? 'Ppl' : 'Participants'}</th>
              {onEditCompetition && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {contests.map((contest: IContest) => {
              const showApproveButton =
                contest.state === ContestState.Created && isAdmin && (contest.meetupDetails || contest.compDetails);

              return (
                <tr key={contest.competitionId}>
                  <td>{getFormattedDate(contest.startDate, contest.endDate, contest.timezone)}</td>
                  <td>
                    <Link href={`/competitions/${contest.competitionId}`} prefetch={false} className="link-primary">
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
                    <ContestTypeBadge type={contest.type} brief={!!onEditCompetition} />
                  </td>
                  <td>{contest.participants || ''}</td>

                  {onEditCompetition && (
                    <td className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEditCompetition(contest.competitionId)}
                        disabled={disableActions}
                        className="btn btn-primary btn-sm"
                        style={{ padding: C.smallButtonPadding }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopyCompetition(contest.competitionId)}
                        disabled={disableActions}
                        className="btn btn-primary btn-sm"
                        style={{ padding: C.smallButtonPadding }}
                      >
                        Clone
                      </button>
                      {showApproveButton && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(contest.competitionId, ContestState.Approved)}
                          disabled={disableActions}
                          className="btn btn-warning btn-sm"
                          style={{ padding: C.smallButtonPadding }}
                        >
                          Approve
                        </button>
                      )}
                      {/* Mods should be able to see this button even before approval, it should just be disabled */}
                      {(contest.state >= ContestState.Approved || !isAdmin) &&
                        contest.state < ContestState.Finished && (
                        <button
                          type="button"
                          onClick={() => onPostCompResults(contest.competitionId)}
                          disabled={disableActions || contest.state < ContestState.Approved}
                          className="btn btn-sm btn-success"
                          style={{ padding: C.smallButtonPadding }}
                        >
                            Results
                        </button>
                      )}
                      {contest.state >= ContestState.Finished && isAdmin && (
                        <button
                          type="button"
                          onClick={() => onPostCompResults(contest.competitionId)}
                          disabled={disableActions}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: C.smallButtonPadding }}
                        >
                          Results
                        </button>
                      )}
                      {contest.state === ContestState.Ongoing && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(contest.competitionId, ContestState.Finished)}
                          disabled={disableActions}
                          className="btn btn-warning btn-sm"
                          style={{ padding: C.smallButtonPadding }}
                        >
                          Finish
                        </button>
                      )}
                      {contest.state === ContestState.Finished && isAdmin && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(contest.competitionId, ContestState.Published)}
                          disabled={disableActions}
                          className="btn btn-warning btn-sm"
                          style={{ padding: C.smallButtonPadding }}
                        >
                          Publish
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ContestsTable;
