import myFetch from '~/helpers/myFetch';
import ContestLayout from '@c/ContestLayout';
import Schedule from '@c/Schedule';
import { IContest } from '@sh/types';

const CompetitionSchedulePage = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 0 });
  if (!contestData) return <h3 className="mt-4 text-center">Contest not found</h3>;
  const { contest }: { contest: IContest } = contestData;

  return (
    <ContestLayout contest={contest} activeTab="schedule">
      <Schedule
        rooms={contest.compDetails.schedule.venues[0].rooms}
        contestEvents={contest.events}
        timezone={contest.compDetails.schedule.venues[0].timezone}
      />
    </ContestLayout>
  );
};

export default CompetitionSchedulePage;
