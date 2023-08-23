'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import PostResultsScreen from '@c/adminAndModerator/PostResultsScreen';
import { ICompetitionModData } from '~/shared_helpers/interfaces';
import Loading from '~/app/components/Loading';

const PostCompetitionResults = ({ params }: { params: { id: string } }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [competitionData, setCompetitionData] = useState<ICompetitionModData>();

  useEffect(() => {
    myFetch.get(`/competitions/mod/${params.id}`, { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setCompetitionData(payload as ICompetitionModData);
    });
  }, [params.id]);

  if (competitionData) {
    return <PostResultsScreen compData={competitionData} />;
  } else if (errorMessages.length > 0) {
    return <p className="mt-5 text-center fs-4">{errorMessages[0]}</p>;
  }

  return <Loading />;
};

export default PostCompetitionResults;
