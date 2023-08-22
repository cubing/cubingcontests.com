'use client';

import myFetch from '~/helpers/myFetch';
import PostResultsScreen from '@c/adminAndModerator/PostResultsScreen';

const PostCompetitionResults = async ({ params }: { params: { id: string } }) => {
  const { payload: competitionData } = await myFetch.get(`/competitions/mod/${params.id}`, { authorize: true });

  if (competitionData) {
    return <PostResultsScreen compData={competitionData} />;
  } else {
    return <p className="text-center fs-5">Error while fetching data</p>;
  }
};

export default PostCompetitionResults;
