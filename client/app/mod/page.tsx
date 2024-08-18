'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useMyFetch } from '~/helpers/customHooks';
import ToastMessages from '@c/UI/ToastMessages';
import { ContestState, ContestType } from '@sh/enums';
import { IAdminStats, IContest } from '@sh/types';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { getFormattedDate, getUserInfo } from '~/helpers/utilityFunctions';
import { MainContext } from '~/helpers/contexts';
import Country from '@c/Country';
import ContestTypeBadge from '@c/ContestTypeBadge';
import Button from '@c/UI/Button';

const userInfo: IUserInfo = getUserInfo();

const ModeratorDashboardPage = () => {
  const myFetch = useMyFetch();
  const { loadingId, changeLoadingId } = useContext(MainContext);

  const [contests, setContests] = useState<IContest[]>();
  const [adminStats, setAdminStats] = useState<IAdminStats>();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const anl = adminStats?.analytics;

  useEffect(() => {
    myFetch.get('/competitions/mod', { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setContests(payload);
    });

    if (userInfo.isAdmin) {
      myFetch.get('/admin-stats', { authorize: true }).then(({ payload, errors }) => {
        if (!errors) setAdminStats(payload);
      });
    }
  }, []);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const editContest = (competitionId: string) => {
    changeLoadingId(`edit_${competitionId}_button`);
    window.location.href = `/mod/competition?edit_id=${competitionId}`;
  };

  const cloneContest = (competitionId: string) => {
    changeLoadingId(`clone_${competitionId}_button`);
    window.location.href = `/mod/competition?copy_id=${competitionId}`;
  };

  const enterResults = (competitionId: string) => {
    changeLoadingId(`enter_${competitionId}_results_button`);
    window.location.href = `/mod/competition/${competitionId}`;
  };

  const changeState = async (competitionId: string, newState: ContestState) => {
    const { payload, errors } = await myFetch.patch(
      `/competitions/set-state/${competitionId}`,
      { newState },
      { loadingId: `set_state_${newState}_${competitionId}_button` },
    );

    if (!errors) setContests(contests.map((c) => (c.competitionId === competitionId ? payload : c)));
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Moderator Dashboard</h2>

      <ToastMessages />

      <div className="px-2">
        <div className="my-4 d-flex flex-wrap gap-3 fs-5">
          <Link href="/mod/competition" className="btn btn-success btn-sm btn-lg-md">
            Create new contest
          </Link>
          {/* <Link href="/mod/competitors" className="btn btn-warning btn-sm btn-lg-md">
            Manage competitors
          </Link> */}
          {userInfo.isAdmin && (
            <>
              <Link href="/admin/results" className="btn btn-warning btn-sm btn-lg-md">
                Manage results
              </Link>
              <Link href="/admin/users" className="btn btn-warning btn-sm btn-lg-md">
                Manage users
              </Link>
              {/* <Link href="/admin/import-export" className="btn btn-warning btn-sm btn-lg-md">
                Import/Export
              </Link> */}
              <Link href="/admin/events" className="btn btn-secondary btn-sm btn-lg-md">
                Configure events
              </Link>
              <Link href="/admin/record-types" className="btn btn-secondary btn-sm btn-lg-md">
                Configure record types
              </Link>
            </>
          )}
        </div>
        {adminStats && (
          <>
            <p>
              Total contests: <b>{contests?.length || 0}</b>&#8194;|&#8194;Total competitors:{' '}
              <b>{adminStats.totalPersons}</b>
            </p>
            <p>
              Total users:&nbsp;
              <b>{adminStats.totalUsers}</b>&#8194;|&#8194;Unconfirmed:&nbsp;<b>{adminStats.unconfirmedUsers}</b>
            </p>
            <p>
              Total results:&nbsp;<b>{adminStats.totalResults}</b>&#8194;|&#8194;Unapproved:&nbsp;
              <b>{adminStats.totalUnapprovedSubmittedResults}</b>
            </p>
            <button
              type="button"
              className="btn btn-success btn-sm mt-2 mb-4"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? 'Hide analytics' : 'Show analytics'}
            </button>
            {showAnalytics && (
              <div className="mb-4">
                <h5 className="mb-4">Stats for the past month</h5>
                <p>
                  Contests list views: <b>{anl.getContests}</b> | Mod dashboard views: <b>{anl.getModContests}</b>
                </p>
                <p>
                  Contest page views: <b>{anl.getContest}</b> | Edit contest / post results views:{' '}
                  <b>{anl.getModContest}</b>
                </p>
                <p>
                  Rankings views: <b>{anl.getRankings}</b> | Records views: <b>{anl.getRecords}</b>
                </p>
                <p>
                  Contests created: <b>{anl.createContest}</b> | Contest updates: <b>{anl.updateContest}</b> | Contest
                  state updates: <b>{anl.updateContestState}</b>
                </p>
                <p>
                  Results created: <b>{anl.createResult}</b> | Results deleted: <b>{anl.deleteResult}</b>
                </p>
                <p>
                  Results submitted: <b>{anl.submitResult}</b> | Submitted result updates by admin:{' '}
                  <b>{anl.updateResult}</b>
                </p>
                <p>
                  Persons created: <b>{anl.createPerson}</b>
                </p>
                <p>
                  Events created: <b>{anl.createEvent}</b> | Event updates: <b>{anl.updateEvent}</b>
                </p>
                <p>
                  Record types updates: <b>{anl.updateRecordTypes}</b>
                </p>
                <p>
                  Users registered: <b>{anl.createUser}</b> | User updates by admin: <b>{anl.updateUser}</b>
                </p>
              </div>
            )}
          </>
        )}
        {!userInfo.isAdmin && (
          <>
            <p className="my-4 fs-5">
              Your contests will not be public and you will not be able to enter results until an admin approves them
            </p>
            <p>
              Number of contests: <b>{contests?.length || 0}</b>
            </p>
          </>
        )}
      </div>
      {contests?.length > 0 ? (
        <div className="mb-5 table-responsive">
          <table className="table table-hover text-nowrap">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Name</th>
                <th scope="col">Place</th>
                <th scope="col">Type</th>
                <th scope="col">Ppl</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contests.map((contest: IContest) => {
                const showApproveButton =
                  contest.state === ContestState.Created &&
                  userInfo.isAdmin &&
                  (contest.meetupDetails || contest.compDetails);

                return (
                  <tr key={contest.competitionId}>
                    <td>{getFormattedDate(contest.startDate, contest.endDate, contest.timezone)}</td>
                    <td>
                      <Link href={`/competitions/${contest.competitionId}`} prefetch={false} className="link-primary">
                        {contest.shortName}
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
                      <ContestTypeBadge type={contest.type} brief />
                    </td>
                    <td>{contest.participants || ''}</td>

                    <td className="d-flex gap-2">
                      <Button
                        id={`edit_${contest.competitionId}_button`}
                        type="button"
                        text="Edit"
                        onClick={() => editContest(contest.competitionId)}
                        loadingId={loadingId}
                        className="btn btn-primary btn-xs"
                      />
                      <Button
                        id={`clone_${contest.competitionId}_button`}
                        type="button"
                        text="Clone"
                        onClick={() => cloneContest(contest.competitionId)}
                        loadingId={loadingId}
                        className="btn btn-primary btn-xs"
                      />
                      {/* Mods should be able to see this button even before approval, it should just be disabled */}
                      {(contest.state < ContestState.Finished || userInfo.isAdmin) && (
                        <Button
                          id={`enter_${contest.competitionId}_results_button`}
                          type="button"
                          text="Results"
                          onClick={() => enterResults(contest.competitionId)}
                          disabled={!userInfo.isAdmin && contest.state < ContestState.Approved}
                          loadingId={loadingId}
                          className={`btn btn-xs ${
                            contest.state < ContestState.Finished ? 'btn-success' : 'btn-secondary'
                          }`}
                        />
                      )}
                      {showApproveButton && (
                        <Button
                          id={`set_state_${ContestState.Approved}_${contest.competitionId}_button`}
                          type="button"
                          text="Approve"
                          onClick={() => changeState(contest.competitionId, ContestState.Approved)}
                          loadingId={loadingId}
                          className="btn btn-warning btn-xs"
                        />
                      )}
                      {contest.state === ContestState.Ongoing && (
                        <Button
                          id={`set_state_${ContestState.Finished}_${contest.competitionId}_button`}
                          type="button"
                          text="Finish"
                          onClick={() => changeState(contest.competitionId, ContestState.Finished)}
                          loadingId={loadingId}
                          className="btn btn-warning btn-xs"
                        />
                      )}
                      {contest.state === ContestState.Finished && userInfo.isAdmin && (
                        <Button
                          id={`set_state_${ContestState.Published}_${contest.competitionId}_button`}
                          type="button"
                          text="Publish"
                          onClick={() => changeState(contest.competitionId, ContestState.Published)}
                          loadingId={loadingId}
                          className="btn btn-warning btn-xs"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-2 fs-5">You haven't created any contests yet</p>
      )}
    </div>
  );
};

export default ModeratorDashboardPage;
