'use client';

import myFetch from '~/helpers/myFetch';
import PostResultsScreen from '@c/adminAndModerator/PostResultsScreen';
import { ICompetitionModData, IRecordType } from '@sh/interfaces';

const PostCompetitionResults = async ({ params }: { params: { id: string } }) => {
  const competitionData: ICompetitionModData = await myFetch.get(`/competitions/mod/${params.id}`, { authorize: true });
  const activeRecordTypes: IRecordType[] = await myFetch.get('/record-types?active=true', { authorize: true });

  return <PostResultsScreen compData={competitionData} activeRecordTypes={activeRecordTypes} />;
};

export default PostCompetitionResults;
