'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';
import CompetitionForm from '@c/adminAndModerator/CompetitionForm';
import { ICompetition, IEvent } from '@sh/interfaces';
import { getRole } from '~/helpers/utilityFunctions';

const fetchData = async (
  competitionId: string,
  setEvents: (value: IEvent[]) => void,
  setCompetition: (value: ICompetition) => void,
  setErrorMessages: (value: string[]) => void,
) => {
  const { payload: events, errors } = await myFetch.get('/events');

  if (errors) {
    setErrorMessages(errors);
    return;
  }

  setEvents(events);

  if (competitionId) {
    const { payload, errors } = await myFetch.get(`/competitions/mod/${competitionId}`, { authorize: true });

    if (errors) {
      setErrorMessages(errors);
    } else if (payload) {
      setCompetition(payload.competition);
    }
  }
};

const CreateEditCompetition = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [events, setEvents] = useState<IEvent[]>();
  const [competition, setCompetition] = useState<ICompetition>();

  const role = useMemo(getRole, [getRole]);

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
    fetchData(competitionId, setEvents, setCompetition, setErrorMessages);
  }, [competitionId]);

  if (events && (mode === 'new' || competition)) {
    return (
      <>
        <h2 className="mb-4 text-center">{mode === 'edit' ? 'Edit Competition' : 'Create Competition'}</h2>
        <CompetitionForm events={events} competition={competition} mode={mode} role={role} />
      </>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default CreateEditCompetition;
