'use client';

import myFetch from '~/helpers/myFetch';
import IRecordType from '@sh/interfaces/RecordType';
import RecordTypesForm from '~/app/components/admin/RecordTypesForm';

const RecordTypes = async () => {
  const recordTypes: IRecordType[] = await myFetch.get('/record-types', { authorize: true });
  console.log('Response after fetching record types:', recordTypes);

  return (
    <>
      <h2 className="mb-4 text-center">Record Types</h2>
      <RecordTypesForm recordTypes={recordTypes} />
    </>
  );
};

export default RecordTypes;
