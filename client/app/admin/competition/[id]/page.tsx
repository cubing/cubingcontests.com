import myFetch from '~/helpers/myFetch';
import IEvent from '@sh/interfaces/Event';
import PostResultsScreen from '~/app/components/admin/PostResultsScreen';
import ICompetition from '~/shared_helpers/interfaces/Competition';

const PostCompetitionResults = async ({ params }: { params: { id: string } }) => {
  const competition: ICompetition = (await myFetch.get(`/competitions/${params.id}`)).competition;
  const events: IEvent[] = await myFetch.get('/events');

  return (
    <>
      <h2 className="text-center">Post results for {competition.name || 'ERROR'}</h2>
      <PostResultsScreen events={events} competition={competition} />
    </>
  );
};

export default PostCompetitionResults;
