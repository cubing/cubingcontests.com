'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';
import PostResultsScreen from '@c/adminAndModerator/PostResultsScreen';
import { IContestData } from '@sh/interfaces';

const PostResultsPage = ({ params }: { params: { id: string } }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [contestData, setContestData] = useState<IContestData>();

  useEffect(() => {
    myFetch.get(`/competitions/mod/${params.id}`, { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setContestData(payload as IContestData);
    });
  }, [params.id]);

  if (contestData) {
    return <PostResultsScreen compData={contestData} />;
  }

  return <Loading errorMessages={errorMessages} />;
};

export default PostResultsPage;
