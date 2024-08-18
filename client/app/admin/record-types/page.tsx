'use client';

import { useState, useEffect } from 'react';
import { useMyFetch } from '~/helpers/customHooks';
import RecordTypesForm from './RecordTypesForm';
import { IRecordType } from '@sh/types';
import Loading from '@c/UI/Loading';

const ConfigureRecordTypesPage = () => {
  const myFetch = useMyFetch();

  const [recordTypes, setRecordTypes] = useState<IRecordType[]>();

  useEffect(() => {
    myFetch.get('/record-types', { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setRecordTypes(payload as IRecordType[]);
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

  return <Loading />;
};

export default ConfigureRecordTypesPage;
