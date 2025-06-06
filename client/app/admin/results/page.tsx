import ManageResultsScreen from "./ManageResultsScreen.tsx";
import { ssrFetch } from "~/helpers/fetchUtils.ts";

const ManageResultsPage = async () => {
  const res = await ssrFetch("/record-types");

  if (!res.success) return <h3 className="mt-4 text-center">Error while fetching record types</h3>;

  return <ManageResultsScreen recordTypes={res.data} />;
};

export default ManageResultsPage;
