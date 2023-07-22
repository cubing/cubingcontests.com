'use client';

import myFetch from '~/helpers/myFetch';
import RecordTypesForm from '@c/adminAndModerator/RecordTypesForm';

const RecordTypes = async () => {
  const { payload: recordTypes, errors } = await myFetch.get('/record-types', { authorize: true });

  return (
    <>
      <h2 className="mb-4 text-center">Record Types</h2>
      {recordTypes && <RecordTypesForm recordTypes={recordTypes} errors={errors} />}
    </>
  );
};

export default RecordTypes;
