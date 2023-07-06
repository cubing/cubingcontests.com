'use client';

import myFetch from '~/helpers/myFetch';
import { IRecordType } from '@sh/interfaces';
import RecordTypesForm from '@c/adminAndModerator/RecordTypesForm';

const RecordTypes = async () => {
  const recordTypes: IRecordType[] = await myFetch.get('/record-types', { authorize: true });
  console.log('Response after fetching record types:', recordTypes);

  return (
    <>
      <h2 className="mb-4 text-center">Record Types</h2>
      {recordTypes.length > 0 || (
        <p className="mt-3 text-center fs-5">AFTER THE RECORD LABELS HAVE BEEN SET, THEY CAN NEVER BE RESET!</p>
      )}
      <RecordTypesForm recordTypes={recordTypes} />
    </>
  );
};

export default RecordTypes;
