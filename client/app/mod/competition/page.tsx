'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/UI/Loading';
import ContestForm from './ContestForm';
import { IContestData, IEvent } from '@sh/interfaces';

const CreateEditContestPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
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

  const fetchData = async () => {
    const { payload: eventsData, errors: errors1 } = await myFetch.get('/events/mod', { authorize: true });
    const { payload: contestData, errors: errors2 } = competitionId
      ? await myFetch.get(`/competitions/mod/${competitionId}`, { authorize: true })
      : undefined;

    if (errors1 ?? errors2) {
      setErrorMessages(['Error while fetching contest data']);
    } else {
      setEvents(eventsData);
      if (contestData) setContestData(contestData);
    }
  };

  if (events && (mode === 'new' || contestData)) {
    return (
      <div>
        <h2 className="mb-4 text-center">{mode === 'edit' ? 'Edit Competition' : 'Create Competition'}</h2>

        <ContestForm events={events} contestData={contestData} mode={mode} />
      </div>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default CreateEditContestPage;
