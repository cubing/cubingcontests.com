'use client';

import myFetch from '~/helpers/myFetch';
import RecordTypesForm from '@c/adminAndModerator/RecordTypesForm';

const RecordTypes = async () => {
  const { payload: recordTypes, errors } = await myFetch.get('/record-types', { authorize: true });

  return (
    <>
      <h2 className="mb-4 text-center">Record Types</h2>
      {recordTypes.length === 0 && (
        <p className="mt-3 text-center fs-5">AFTER THE RECORD LABELS HAVE BEEN SET, THEY CANNOT BE RESET!</p>
      )}
      {recordTypes && <RecordTypesForm recordTypes={recordTypes} errors={errors} />}
    </>
  );
};

export default RecordTypes;
