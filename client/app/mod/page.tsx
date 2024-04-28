'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import ContestsTable from '@c/ContestsTable';
import ErrorMessages from '@c/UI/ErrorMessages';
import { ContestState } from '@sh/enums';
import { IAdminStats, IContest } from '@sh/types';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { getUserInfo } from '~/helpers/utilityFunctions';
import { useScrollToTopForNewMessage } from '~/helpers/clientSideFunctions';

const userInfo: IUserInfo = getUserInfo();

const ModeratorDashboardPage = () => {
  const [contests, setContests] = useState<IContest[]>();
  const [adminStats, setAdminStats] = useState<IAdminStats>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const anl = adminStats?.analytics;

  useEffect(() => {
    setLoading(true);

    myFetch.get('/competitions/mod', { authorize: true }).then(({ payload: contests, errors }) => {
      if (errors) {
        setErrorMessages(errors);
      } else {
        setContests(contests);
        setLoading(false);
      }
    });

    if (userInfo.isAdmin) {
      myFetch.get('/admin-stats', { authorize: true }).then(({ payload, errors }) => {
        if (errors) setErrorMessages(errors);
        else setAdminStats(payload);
      });
    }
  }, []);

  useScrollToTopForNewMessage({ errorMessages });

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const editCompetition = (competitionId: string) => {
    window.location.href = `/mod/competition?edit_id=${competitionId}`;
    setLoading(true);
  };

  const copyCompetition = (competitionId: string) => {
    window.location.href = `/mod/competition?copy_id=${competitionId}`;
    setLoading(true);
  };

  const postCompResults = (competitionId: string) => {
    window.location.href = `/mod/competition/${competitionId}`;
    setLoading(true);
  };

  const changeCompState = async (competitionId: string, newState: ContestState) => {
    setLoading(true);
    const { errors } = await myFetch.patch(`/competitions/${competitionId}/${newState}`);

    if (errors) {
      setErrorMessages(errors);
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <div>
      <h2 className="text-center">Moderator Dashboard</h2>

      <ErrorMessages errorMessages={errorMessages} />

      <div className="px-2">
        <div className="my-4 d-flex flex-wrap gap-3 fs-5">
          <Link href="/mod/competition" className="btn btn-success btn-sm btn-lg-md">
            Create new contest
          </Link>
          <Link href="/mod/person" className="btn btn-success btn-sm btn-lg-md">
            Add competitors
          </Link>
          {userInfo.isAdmin && (
            <>
              <Link href="/admin/results" className="btn btn-warning btn-sm btn-lg-md">
                Manage results
              </Link>
              <Link href="/admin/users" className="btn btn-warning btn-sm btn-lg-md">
                Manage users
              </Link>
              <Link href="/admin/import-export" className="btn btn-warning btn-sm btn-lg-md">
                Import/Export
              </Link>
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
        <ContestsTable
          contests={contests}
          onEditCompetition={editCompetition}
          onCopyCompetition={copyCompetition}
          onPostCompResults={postCompResults}
          onChangeCompState={changeCompState}
          modView
          isAdmin={userInfo.isAdmin}
          disableActions={loading}
        />
      ) : (
        <p className="px-2 fs-5">You haven't created any contests yet</p>
      )}
    </div>
  );
};

export default ModeratorDashboardPage;
