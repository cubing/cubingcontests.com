'use client';

import myFetch from '~/helpers/myFetch';
import PostResultsScreen from '@c/adminAndModerator/PostResultsScreen';

const PostCompetitionResults = async ({ params }: { params: { id: string } }) => {
  const { payload: competitionData } = await myFetch.get(`/competitions/mod/${params.id}`, { authorize: true });
  const { payload: activeRecordTypes } = await myFetch.get('/record-types?active=true', { authorize: true });

  if (competitionData && activeRecordTypes) {
    return <PostResultsScreen compData={competitionData} activeRecordTypes={activeRecordTypes} />;
  } else {
    return <p className="text-center fs-5">Error while fetching data</p>;
  }
};

export default PostCompetitionResults;
