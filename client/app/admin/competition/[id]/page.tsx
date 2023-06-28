import myFetch from '~/helpers/myFetch';
import IEvent from '@sh/interfaces/Event';
import PostResultsScreen from '~/app/components/PostResultsScreen';

const PostCompetitionResults = async ({ params }: { params: { id: string } }) => {
  const events: IEvent[] = await myFetch.get('/events');

  return (
    <>
      <h2 className="text-center">Post results for {params.id}</h2>
      <PostResultsScreen events={events} competitionId={params.id} />
    </>
  );
};

export default PostCompetitionResults;
