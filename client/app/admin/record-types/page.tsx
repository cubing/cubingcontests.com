'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import RecordTypesForm from '@c/adminAndModerator/RecordTypesForm';
import { IRecordType } from '~/shared_helpers/interfaces';
import Loading from '@c/Loading';

const ConfigureRecordTypes = async () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [recordTypes, setRecordTypes] = useState<IRecordType[]>();

  useEffect(() => {
    myFetch.get('/record-types', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setRecordTypes(payload);
    });
  }, []);

  if (recordTypes) {
    return (
      <>
        <h2 className="mb-4 text-center">Record Types</h2>
        <RecordTypesForm recordTypes={recordTypes} />
      </>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default ConfigureRecordTypes;
