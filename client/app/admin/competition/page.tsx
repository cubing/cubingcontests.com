'use client';

import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import CompetitionForm from '@c/adminAndModerator/CompetitionForm';
import { ICompetitionModData } from '@sh/interfaces';

const CreateCompetition = async () => {
  const searchParams = useSearchParams();

  const editId = searchParams.get('edit_id');
  const { payload: events } = await myFetch.get('/events');
  let competitionData: ICompetitionModData;

  if (editId) {
    competitionData = (await myFetch.get(`/competitions/mod/${editId}`, { authorize: true }))?.payload;
  }

  if (events) {
    return (
      <>
        <h2 className="mb-4 text-center">{editId ? 'Edit Competition' : 'Create Competition'}</h2>
        <CompetitionForm events={events} competition={competitionData?.competition} />
      </>
    );
  } else {
    return <p className="text-center fs-5">Error while fetching events</p>;
  }
};

export default CreateCompetition;
