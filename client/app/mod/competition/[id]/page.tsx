'use client';

import React, { useEffect, useState } from 'react';
import { useMyFetch } from '~/helpers/customHooks.ts';
import Loading from '~/app/components/UI/Loading.tsx';
import DataEntryScreen from '~/app/components/adminAndModerator/DataEntryScreen.tsx';
import { IContestData } from '~/shared_helpers/types.ts';

const PostResultsPage = ({
  params: { id },
  searchParams: { eventId },
}: {
  params: { id: string };
  searchParams: { eventId: string };
}) => {
  const myFetch = useMyFetch();

  const [contestData, setContestData] = useState<IContestData>();

  useEffect(() => {
    myFetch
      .get(`/competitions/mod/${id}?eventId=${eventId ?? 'FIRST_EVENT'}`, {
        authorize: true,
      })
      .then(({ payload, errors }) => {
        if (!errors) setContestData(payload as IContestData);
      });
  }, [id]);

  if (contestData) return <DataEntryScreen compData={contestData} />;

  return <Loading />;
};

export default PostResultsPage;
