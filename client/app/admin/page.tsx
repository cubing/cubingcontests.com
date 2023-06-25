import Link from 'next/link';

const AdminHome = () => {
  return (
    <>
      <h2 className="text-center">Admin Home</h2>
      <div className="mt-3 fs-5">
        <Link href="/admin/competition">Create new competition</Link>
      </div>
    </>
  );
};

export default AdminHome;
