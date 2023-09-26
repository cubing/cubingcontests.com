'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import ContestsTable from '@c/ContestsTable';
import { ContestState } from '@sh/enums';
import { IAdminStats, IContest } from '~/shared_helpers/interfaces';
import { getUserInfo } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';

const userInfo: IUserInfo = getUserInfo();

const fetchData = async (
  isAdmin: boolean,
  setContests: (value: IContest[]) => void,
  setAdminStats: (value: IAdminStats) => void,
) => {
  const { payload: contests } = await myFetch.get(`/competitions/mod`, { authorize: true });

  if (contests) {
    setContests(contests);

    if (isAdmin) {
      const { payload } = await myFetch.get('/admin-stats', { authorize: true });

      if (payload) {
        setAdminStats(payload);
      }
    }
  }
};

const ModeratorDashboardPage = () => {
  const [contests, setContests] = useState<IContest[]>();
  const [adminStats, setAdminStats] = useState<IAdminStats>();

  useEffect(() => {
    fetchData(userInfo.isAdmin, setContests, setAdminStats);
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
    await myFetch.patch(`/competitions/${competitionId}?action=change_state`, {
      state: newState,
    });

    window.location.reload();
  };

  return (
    <>
      <h2 className="text-center">Moderator Dashboard</h2>
      <div className="my-4 d-flex gap-3 fs-5">
        <Link href="/mod/competition" className="btn btn-success">
          Create new contest
        </Link>
        <Link href="/mod/person" className="btn btn-success">
          Add competitors
        </Link>
        <Link href="/user/submit-results" className="btn btn-success">
          Submit results
        </Link>
        {userInfo.isAdmin && (
          <>
            <Link href="/admin/import-export" className="btn btn-warning">
              Import/Export
            </Link>
            <Link href="/admin/record-types" className="btn btn-secondary">
              Configure record types
            </Link>
          </>
        )}
      </div>
      {adminStats && (
        <>
          <p>
            Competitors in DB: <b>{adminStats.totalPersons}</b>
          </p>
          <p>
            Users in DB: <b>{adminStats.totalUsers}</b>
          </p>
          <p>
            Unapproved results: <b>{adminStats.totalUnapprovedSubmittedResults}</b>
          </p>
        </>
      )}
      <p>
        Number of contests: <b>{contests ? contests.length : `?`}</b>
      </p>
      {contests?.length > 0 ? (
        <ContestsTable
          contests={contests}
          onEditCompetition={editCompetition}
          onCopyCompetition={copyCompetition}
          onPostCompResults={postCompResults}
          onChangeCompState={changeCompState}
          isAdmin={userInfo.isAdmin}
        />
      ) : (
        <p className="fs-5">You haven&apos;t created any contests yet</p>
      )}
    </>
  );
};

export default ModeratorDashboardPage;
