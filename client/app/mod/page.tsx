'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import CompetitionsTable from '@c/CompetitionsTable';
import { ContestState, Role } from '@sh/enums';
import { ICompetition } from '~/shared_helpers/interfaces';
import { getRole } from '~/helpers/utilityFunctions';

const fetchData = async (
  role: Role,
  setCompetitions: (value: ICompetition[]) => void,
  setPersonsTotal: (value: number) => void,
  setUsersTotal: (value: number) => void,
) => {
  const { payload: competitions } = await myFetch.get('/competitions/mod', { authorize: true });
  setCompetitions(competitions);

  if (role === Role.Admin) {
    const { payload: personsTotal } = await myFetch.get('/persons/total');
    const { payload: usersTotal } = await myFetch.get('/users/total', { authorize: true });
    setPersonsTotal(personsTotal);
    setUsersTotal(usersTotal);
  }
};

const ModeratorDashboard = () => {
  const [role, setRole] = useState<Role>();
  const [competitions, setCompetitions] = useState<ICompetition[]>();
  const [personsTotal, setPersonsTotal] = useState<number>(null);
  const [usersTotal, setUsersTotal] = useState<number>(null);

  useEffect(() => {
    const tempRole = getRole();

    setRole(tempRole);
    fetchData(tempRole, setCompetitions, setPersonsTotal, setUsersTotal);
  }, []);

  const logOut = () => {
    localStorage.removeItem('jwtToken');
    window.location.href = '/';
  };

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
      <button type="button" className="mt-4 btn btn-danger" style={{ width: 'max-content' }} onClick={logOut}>
        Log out
      </button>
      <div className="my-4 d-flex gap-3 fs-5">
        <Link href="/mod/competition">
          <button type="button" className="btn btn-success">
            Create new contest
          </button>
        </Link>
        <Link href="/mod/person">
          <button type="button" className="btn btn-success">
            Add competitors
          </button>
        </Link>
        {role === Role.Admin && (
          <>
            <Link href="/admin/submit-results">
              <button type="button" className="btn btn-success">
                Submit results
              </button>
            </Link>
            <Link href="/admin/record-types">
              <button type="button" className="btn btn-secondary">
                Configure record types
              </button>
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
        Number of contests: <b>{competitions ? competitions.length : '?'}</b>
      </p>
      {competitions?.length > 0 ? (
        <CompetitionsTable
          competitions={competitions}
          onEditCompetition={editCompetition}
          onCopyCompetition={copyCompetition}
          onPostCompResults={postCompResults}
          onChangeCompState={changeCompState}
          isAdmin={role === Role.Admin}
        />
      ) : (
        <p className="fs-5">You haven&apos;t created any contests yet</p>
      )}
    </>
  );
};

export default ModeratorDashboard;
