'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import ContestsTable from '@c/ContestsTable';
import ErrorMessages from '@c/ErrorMessages';
import { ContestState } from '@sh/enums';
import { IAdminStats, IContest } from '@sh/interfaces';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { getUserInfo } from '~/helpers/utilityFunctions';

const userInfo: IUserInfo = getUserInfo();

const ModeratorDashboardPage = () => {
  const [contests, setContests] = useState<IContest[]>();
  const [adminStats, setAdminStats] = useState<IAdminStats>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  useEffect(() => {
    myFetch.get('/competitions/mod', { authorize: true }).then(({ payload: contests, errors }) => {
      if (errors) setErrorMessages(errors);
      else setContests(contests);
    });

    if (userInfo.isAdmin) {
      myFetch.get('/admin-stats', { authorize: true }).then(({ payload, errors }) => {
        if (errors) setErrorMessages(errors);
        else setAdminStats(payload);
      });
    }
  }, []);

  const editCompetition = (competitionId: string) => {
    window.location.href = `/mod/competition?edit_id=${competitionId}`;
  };

  const copyCompetition = (competitionId: string) => {
    window.location.href = `/mod/competition?copy_id=${competitionId}`;
  };

  const postCompResults = (competitionId: string) => {
    window.location.href = `/mod/competition/${competitionId}`;
  };

  const changeCompState = async (competitionId: string, newState: ContestState) => {
    const { errors } = await myFetch.patch(`/competitions/${competitionId}/${newState}`);

    if (errors) {
      setErrorMessages(errors);
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
              Total competitors: <b>{adminStats.totalPersons}</b>&#8194;|&#8194;Total users:&nbsp;
              <b>{adminStats.totalUsers}</b>
            </p>
            <p>
              Total results:&nbsp;<b>{adminStats.totalResults}</b>&#8194;|&#8194;Unapproved:&nbsp;
              <b>{adminStats.totalUnapprovedSubmittedResults}</b>
            </p>
          </>
        )}
        <p>
          Number of contests: <b>{contests?.length || 0}</b>
        </p>
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
        />
      ) : (
        <p className="px-2 fs-5">You haven&apos;t created any contests yet</p>
      )}
    </div>
  );
};

export default ModeratorDashboardPage;
