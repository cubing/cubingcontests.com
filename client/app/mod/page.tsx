'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useMyFetch } from '~/helpers/customHooks';
import ToastMessages from '@c/UI/ToastMessages';
import { ContestState } from '@sh/enums';
import { IAdminStats, IContest } from '@sh/types';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { getFormattedDate, getUserInfo } from '~/helpers/utilityFunctions';
import { MainContext } from '~/helpers/contexts';
import Country from '@c/Country';
import ContestTypeBadge from '@c/ContestTypeBadge';
import Button from '@c/UI/Button';
import Loading from '@c/UI/Loading';

const userInfo: IUserInfo = getUserInfo();

const ModeratorDashboardPage = () => {
  const myFetch = useMyFetch();
  const { loadingId } = useContext(MainContext);

  const [contests, setContests] = useState<IContest[]>();
  const [adminStats, setAdminStats] = useState<IAdminStats>();
  const [showAnalytics, setShowAnalytics] = useState(false);

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
          <Link href="/mod/competitors" className="btn btn-warning btn-sm btn-lg-md">
            Manage competitors
          </Link>
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
              {/* <Link href="/admin/record-types" className="btn btn-secondary btn-sm btn-lg-md">
                Configure record types
              </Link> */}
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
            <Button
              type="button"
              text={showAnalytics ? 'Hide analytics' : 'Show analytics'}
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="btn btn-success btn-sm mt-2 mb-4"
            />
            {showAnalytics && (
              <div className="mb-4">
                <h5 className="mb-4">Stats for the past month</h5>

                {adminStats?.analytics.map((stat) => (
                  <p key={stat.label} className="mb-2">
                    {stat.label}: <b>{stat.value}</b>
                  </p>
                ))}
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
      {!contests ? (
        <Loading />
      ) : contests.length === 0 ? (
        <p className="px-2 fs-5">You haven't created any contests yet</p>
      ) : (
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
                    <td>{getFormattedDate(contest.startDate, contest.endDate)}</td>
                    <td>
                      <Link href={`/competitions/${contest.competitionId}`} prefetch={false} className="link-primary">
                        {contest.shortName}
                      </Link>
                    </td>
                    <td>
                      {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions shorten />
                    </td>
                    <td>
                      <ContestTypeBadge type={contest.type} brief />
                    </td>
                    <td>{contest.participants || ''}</td>

                    <td>
                      {contest.state === ContestState.Removed ? (
                        <span className="text-danger">Removed</span>
                      ) : (
                        <div className="d-flex gap-2">
                          {(contest.state < ContestState.Finished || userInfo.isAdmin) && (
                            <Link
                              href={`/mod/competition?edit_id=${contest.competitionId}`}
                              prefetch={false}
                              className="btn btn-primary btn-xs"
                            >
                              Edit
                            </Link>
                          )}
                          {(contest.state < ContestState.Finished || userInfo.isAdmin) && (
                            <Link
                              href={`/mod/competition/${contest.competitionId}`}
                              prefetch={false}
                              // Mods should be able to see this button even before approval, it should just be disabled
                              className={`btn btn-xs ${
                                contest.state < ContestState.Finished ? 'btn-success' : 'btn-secondary'
                              } ${!userInfo.isAdmin && contest.state < ContestState.Approved ? 'disabled' : ''}`}
                            >
                              Results
                            </Link>
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
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboardPage;
