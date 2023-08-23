'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import RecordTypesForm from '@c/adminAndModerator/RecordTypesForm';
import { IRecordType } from '~/shared_helpers/interfaces';

const RecordTypes = async () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [recordTypes, setRecordTypes] = useState<IRecordType[]>();

  useEffect(() => {
    myFetch.get('/record-types', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setRecordTypes(payload);
    });
  }, []);

  return (
    <>
      <h2 className="mb-4 text-center">Record Types</h2>
      {recordTypes && <RecordTypesForm recordTypes={recordTypes} errors={errorMessages} />}
    </>
  );
};

export default RecordTypes;
