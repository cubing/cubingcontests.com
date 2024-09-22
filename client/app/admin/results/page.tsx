import ManageResults from '~/app/admin/results/ManageResults';
import { ssrFetch } from '~/helpers/fetchUtils';

const ManageResultsPage = async () => {
  const { payload: recordTypes } = await ssrFetch('/record-types');

  if (!recordTypes) return <h3 className="mt-4 text-center">Error while fetching record types</h3>;

  return <ManageResults recordTypes={recordTypes} />;
};

export default ManageResultsPage;
