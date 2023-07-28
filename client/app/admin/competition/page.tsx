'use client';

import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import CompetitionForm from '@c/adminAndModerator/CompetitionForm';

const CreateCompetition = async () => {
  const searchParams = useSearchParams();

  const editId = searchParams.get('edit_id');
  let competitionData;
  const { payload: events } = await myFetch.get('/events');

  if (editId) {
    competitionData = (await myFetch.get(`/competitions/mod/${editId}`, { authorize: true }))?.payload;
  }

  if (events) {
    return (
      <>
        <h2 className="mb-4 text-center">{editId ? 'Edit Competition' : 'Create Competition'}</h2>
        <CompetitionForm events={events} compData={competitionData} />
      </>
    );
  } else {
    return <p className="text-center fs-5">Error while fetching events</p>;
  }
};

export default CreateCompetition;
