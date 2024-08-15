'use client';

import { useState, useEffect, useContext } from 'react';
import myFetch from '~/helpers/myFetch';
import RecordTypesForm from './RecordTypesForm';
import { IRecordType } from '@sh/types';
import Loading from '@c/UI/Loading';
import { MainContext } from '~/helpers/contexts';

const ConfigureRecordTypesPage = () => {
  const { setErrorMessages } = useContext(MainContext);

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

  return <Loading />;
};

export default ConfigureRecordTypesPage;
