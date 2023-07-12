'use client';

import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import CompetitionsTable from '@c/CompetitionsTable';

const AdminHome = async () => {
  const { payload: competitions } = await myFetch.get('/competitions');
  const { payload: personsTotal } = await myFetch.get('/persons/total');
  const { payload: usersTotal } = await myFetch.get('/users/total', { authorize: true });

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
            Competitors in DB: <b>{personsTotal || '?'}</b>
          </p>
          <p>
            Users in DB: <b>{usersTotal || '?'}</b>
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
