'use client';

import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import CompetitionsTable from '@c/CompetitionsTable';
import ICompetition from '@sh/interfaces/Competition';

const AdminHome = async () => {
  const competitions: ICompetition[] = await myFetch.get('/competitions');
  const persons: number = (await myFetch.get('/persons'))?.length;
  const users: number = (await myFetch.get('/users/total', { authorize: true }))?.total;

  const logOut = () => {
    localStorage.removeItem('jwtToken');
    window.location.href = '/';
  };

  return (
    <>
      <h2 className="text-center">Admin Home</h2>
      <button type="button" className="mt-4 btn btn-danger" style={{ width: 'max-content' }} onClick={logOut}>
        Log out
      </button>
      <div className="d-flex flex-column gap-4 my-4 fs-5">
        <Link href="/admin/competition">Create new competition</Link>
        <Link href="/admin/person">Create new competitor</Link>
        <Link href="/admin/record-types">Configure record types</Link>
        <div>
          <p>
            Competitors in DB: <b>{persons || '?'}</b>
          </p>
          <p>
            Users in DB: <b>{users || '?'}</b>
          </p>
          <p>
            Number of competitions: <b>{competitions.length}</b>
          </p>
        </div>
      </div>
      {competitions?.length > 0 && <CompetitionsTable linkToPostResults competitions={competitions} />}
    </>
  );
};

export default AdminHome;
