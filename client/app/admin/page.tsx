'use client';

import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import CompetitionsTable from '@c/CompetitionsTable';

const AdminHome = async () => {
  const persons: number = (await myFetch.get('/persons', { revalidate: false }))?.length;
  const users: number = (await myFetch.get('/users/total', { authorize: true }))?.total;

  return (
    <>
      <h2 className="text-center">Admin Home</h2>
      <div className="my-4 fs-5">
        <Link href="/admin/competition" className="d-block mb-4">
          Create new competition
        </Link>
        <Link href="/admin/person" className="d-block mb-4">
          Create new competitor
        </Link>
        <p>
          Competitors in DB: <b>{persons}</b>
        </p>
        <p>
          Users in DB: <b>{users}</b>
        </p>
      </div>
      <CompetitionsTable revalidate={false} />
    </>
  );
};

export default AdminHome;
