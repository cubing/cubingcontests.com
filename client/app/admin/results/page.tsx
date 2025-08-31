import ManageResultsScreen from "./ManageResultsScreen.tsx";

const ManageResultsPage = async () => {
  const res = await ssrFetch("/record-types");

  if (!res.success) return <h3 className="mt-4 text-center">Error while fetching record types</h3>;

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>

      <ManageResultsScreen recordTypes={res.data} />;
    </section>
  );
};

export default ManageResultsPage;
