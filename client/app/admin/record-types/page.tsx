'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import RecordTypesForm from '@c/adminAndModerator/RecordTypesForm';
import { IRecordType } from '~/shared_helpers/interfaces';
import Loading from '@c/UI/Loading';

const ConfigureRecordTypesPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [recordTypes, setRecordTypes] = useState<IRecordType[]>();

  useEffect(() => {
    myFetch.get('/record-types', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setRecordTypes(payload as IRecordType[]);
    });
  }, []);

  if (recordTypes) {
    return (
      <div>
        <h2 className="mb-4 text-center">Record Types</h2>

        <RecordTypesForm recordTypes={recordTypes} />
      </div>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default ConfigureRecordTypesPage;
