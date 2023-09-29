'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';
import ContestForm from '~/app/components/adminAndModerator/ContestForm';
import { IContest, IEvent } from '@sh/interfaces';

const CreateEditContestPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [events, setEvents] = useState<IEvent[]>();
  const [contest, setCompetition] = useState<IContest>();

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
    myFetch.get('/events/mod', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setEvents(payload);
    });

    if (competitionId) {
      myFetch.get(`/competitions/mod/${competitionId}`, { authorize: true }).then(({ payload, errors }) => {
        if (errors) setErrorMessages(errors);
        else setCompetition(payload?.contest);
      });
    }
  }, []);

  if (events && (mode === 'new' || contest)) {
    return (
      <>
        <h2 className="mb-4 text-center">{mode === 'edit' ? 'Edit Competition' : 'Create Competition'}</h2>

        <ContestForm events={events} contest={contest} mode={mode} />
      </>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default CreateEditContestPage;
