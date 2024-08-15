'use client';

import { useState, useEffect, useContext } from 'react';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/UI/Loading';
import DataEntryScreen from '@c/adminAndModerator/DataEntryScreen';
import { IContestData } from '@sh/types';
import { MainContext } from '~/helpers/contexts';

const PostResultsPage = ({
  params: { id },
  searchParams: { eventId },
}: {
  params: { id: string };
  searchParams: { eventId: string };
}) => {
  const { setErrorMessages } = useContext(MainContext);

  const [contestData, setContestData] = useState<IContestData>();

  useEffect(() => {
    myFetch
      .get(`/competitions/mod/${id}?eventId=${eventId ?? 'FIRST_EVENT'}`, { authorize: true })
      .then(({ payload, errors }) => {
        if (errors) setErrorMessages(errors);
        else setContestData(payload as IContestData);
      });
  }, [id]);

  if (contestData) return <DataEntryScreen compData={contestData} />;

  return <Loading />;
};

export default PostResultsPage;
