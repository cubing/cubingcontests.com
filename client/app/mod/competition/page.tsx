'use client';

import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMyFetch } from '~/helpers/customHooks';
import { IContestData, IEvent } from '@sh/types';
import { MainContext } from '~/helpers/contexts';
import Loading from '@c/UI/Loading';
import ContestForm from './ContestForm';

const CreateEditContestPage = () => {
  const myFetch = useMyFetch();
  const { changeErrorMessages } = useContext(MainContext);

  const [events, setEvents] = useState<IEvent[]>();
  const [contestData, setContestData] = useState<IContestData>();

  const searchParams = useSearchParams();

  let mode: 'new' | 'edit' | 'copy' = 'new';
  let competitionId = searchParams.get('edit_id');

  if (competitionId) {
    mode = 'edit';
  } else {
    competitionId = searchParams.get('copy_id');
    if (competitionId) mode = 'copy';
  }

  useEffect(() => {
    fetchData();
  }, []);

  // CODE SMELL!!!
  const fetchData = async () => {
    const { payload: eventsData, errors: errors1 } = await myFetch.get('/events/mod', {
      authorize: true,
      loadingId: null,
    });
    const { payload: contestData, errors: errors2 } = competitionId
      ? await myFetch.get(`/competitions/mod/${competitionId}`, { authorize: true, loadingId: null })
      : { payload: undefined, errors: undefined };

    if (errors1 ?? errors2) {
      changeErrorMessages(['Error while fetching contest data']);
    } else {
      setEvents(eventsData);
      if (contestData) setContestData(contestData);
    }
  };

  if (events && (mode === 'new' || contestData)) {
    return (
      <div>
        <h2 className="mb-4 text-center">{mode === 'edit' ? 'Edit Contest' : 'Create Contest'}</h2>

        <ContestForm events={events} contestData={contestData} mode={mode} />
      </div>
    );
  }

  return <Loading />;
};

export default CreateEditContestPage;
