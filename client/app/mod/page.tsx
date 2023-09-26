'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import ContestsTable from '@c/ContestsTable';
import { ContestState } from '@sh/enums';
import { IContest } from '~/shared_helpers/interfaces';
import { getUserInfo } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';

const userInfo: IUserInfo = getUserInfo();

const fetchData = async (
  isAdmin: boolean,
  setContests: (value: IContest[]) => void,
  setPersonsTotal: (value: number) => void,
  setUsersTotal: (value: number) => void,
) => {
  const { payload: contests } = await myFetch.get(`/competitions/mod`, { authorize: true });
  setContests(contests);

  if (isAdmin) {
    const { payload: personsTotal } = await myFetch.get(`/persons/total`);
    const { payload: usersTotal } = await myFetch.get(`/users/total`, { authorize: true });
    setPersonsTotal(personsTotal);
    setUsersTotal(usersTotal);
  }
};

const ModeratorDashboardPage = () => {
  const [contests, setContests] = useState<IContest[]>();
  const [personsTotal, setPersonsTotal] = useState<number>(null);
  const [usersTotal, setUsersTotal] = useState<number>(null);

  useEffect(() => {
    fetchData(userInfo.isAdmin, setContests, setPersonsTotal, setUsersTotal);
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
      {personsTotal !== null && (
        <p>
          Competitors in DB: <b>{personsTotal}</b>
        </p>
      )}
      {usersTotal !== null && (
        <p>
          Users in DB: <b>{usersTotal}</b>
        </p>
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
