// import RecordTypesForm from './RecordTypesForm.tsx';
import { ssrFetch } from '~/helpers/fetchUtils.ts';

const ConfigureRecordTypesPage = async () => {
  const { payload: recordTypes } = await ssrFetch('/record-types');

  if (!recordTypes) {
    return <h3 className='mt-4 text-center'>Error while fetching record types</h3>;
  }

  return (
    <div>
      <h2 className='mb-4 text-center'>Record Types</h2>
      TEMPORARILY REMOVED
      {/* <RecordTypesForm recordTypes={recordTypes} /> */}
    </div>
  );
};

export default ConfigureRecordTypesPage;
