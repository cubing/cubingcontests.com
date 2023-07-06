'use client';

import myFetch from '~/helpers/myFetch';
import PostResultsScreen from '@c/adminAndModerator/PostResultsScreen';
import { ICompetitionModData } from '~/shared_helpers/interfaces';

const PostCompetitionResults = async ({ params }: { params: { id: string } }) => {
  const competitionData: ICompetitionModData = await myFetch.get(`/competitions/mod/${params.id}`, { authorize: true });

  return <PostResultsScreen compData={competitionData} />;
};

export default PostCompetitionResults;
