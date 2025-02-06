import ManageResults from "~/app/admin/results/ManageResults.tsx";
import { ssrFetch } from "~/helpers/fetchUtils.ts";

const ManageResultsPage = async () => {
  const res = await ssrFetch("/record-types");

  if (!res.success) return <h3 className="mt-4 text-center">Error while fetching record types</h3>;

  return <ManageResults recordTypes={res.data} />;
};

export default ManageResultsPage;
