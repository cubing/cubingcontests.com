'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import CompetitionForm from '@c/adminAndModerator/CompetitionForm';
import { ICompetition, IEvent } from '@sh/interfaces';
import Loading from '~/app/loading';
import { Role } from '~/shared_helpers/enums';
import { getRole } from '~/helpers/utilityFunctions';

const fetchData = async (
  editId: string,
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

  if (editId) {
    const { payload, errors } = await myFetch.get(`/competitions/mod/${editId}`, { authorize: true });

    if (errors) {
      setErrorMessages(errors);
      return;
    } else if (payload) {
      setCompetition(payload.competition);
    }
  }
};

const CreateEditCompetition = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [role, setRole] = useState<Role>();
  const [events, setEvents] = useState<IEvent[]>();
  const [competition, setCompetition] = useState<ICompetition>();

  const searchParams = useSearchParams();
  const editId = searchParams.get('edit_id');

  useEffect(() => {
    setRole(getRole());
    fetchData(editId, setEvents, setCompetition, setErrorMessages);
  }, [editId]);

  if (events) {
    return (
      <>
        <h2 className="mb-4 text-center">{editId ? 'Edit Competition' : 'Create Competition'}</h2>
        <CompetitionForm events={events} competition={competition} role={role} />
      </>
    );
  } else if (errorMessages.length > 0) {
    return <p className="mt-5 text-center fs-4">{errorMessages[0]}</p>;
  }

  return <Loading />;
};

export default CreateEditCompetition;
