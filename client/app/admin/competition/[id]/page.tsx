import myFetch from '~/helpers/myFetch';
import IEvent from '@sh/interfaces/Event';
import PostResultsScreen from '~/app/components/admin/PostResultsScreen';
import { ICompetitionData } from '~/shared_helpers/interfaces/Competition';

const PostCompetitionResults = async ({ params }: { params: { id: string } }) => {
  const competitionData: ICompetitionData = await myFetch.get(`/competitions/${params.id}`);
  const events: IEvent[] = await myFetch.get('/events');

  return (
    <>
      <h2 className="text-center">
        {competitionData.eventsInfo.length > 0 ? 'Edit' : 'Post'} results for&nbsp;
        {competitionData.competition.name || 'ERROR'}
      </h2>
      <PostResultsScreen events={events} compData={competitionData} />
    </>
  );
};

export default PostCompetitionResults;
