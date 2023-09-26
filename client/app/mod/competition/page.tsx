'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';
import ContestForm from '~/app/components/adminAndModerator/ContestForm';
import { IContest, IContestData, IEvent } from '@sh/interfaces';

const fetchData = async (
  competitionId: string,
  setEvents: (value: IEvent[]) => void,
  setCompetition: (value: IContest) => void,
  setErrorMessages: (value: string[]) => void,
) => {
  const { payload: events, errors } = await myFetch.get(`/events`);

  if (errors) {
    setErrorMessages(errors);
    return;
  }

  setEvents(events);

  if (competitionId) {
    const { payload, errors }: { payload?: IContestData; errors?: string[] } = await myFetch.get(
      `/competitions/mod/${competitionId}`,
      { authorize: true },
    );

    if (errors) {
      setErrorMessages(errors);
    } else if (payload) {
      setCompetition(payload.contest);
    }
  }
};

const CreateEditContestPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [events, setEvents] = useState<IEvent[]>();
  const [contest, setCompetition] = useState<IContest>();

  const searchParams = useSearchParams();

  let mode: `new` | `edit` | `copy` = `new`;
  let competitionId = searchParams.get(`edit_id`);

  if (competitionId) {
    mode = `edit`;
  } else {
    competitionId = searchParams.get(`copy_id`);
    if (competitionId) mode = `copy`;
  }

  useEffect(() => {
    fetchData(competitionId, setEvents, setCompetition, setErrorMessages);
  }, [competitionId]);

  if (events && (mode === `new` || contest)) {
    return (
      <>
        <h2 className="mb-4 text-center">{mode === `edit` ? `Edit Competition` : `Create Competition`}</h2>
        <ContestForm events={events} contest={contest} mode={mode} />
      </>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default CreateEditContestPage;
