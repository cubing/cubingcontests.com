import myFetch from '~/helpers/myFetch';
import CompetitionLayout from '@c/CompetitionLayout';
import Schedule from '@c/Schedule';
import { ICompetition } from '@sh/interfaces';

const CompetitionSchedule = async ({ params }: { params: { id: string } }) => {
  const { payload: competitionData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 60 });
  if (!competitionData) return <h3 className="mt-4 text-center">Competition not found</h3>;
  const { competition }: { competition: ICompetition } = competitionData;

  return (
    <CompetitionLayout competition={competition} activeTab="schedule">
      <Schedule
        rooms={competition.compDetails.schedule.venues[0].rooms}
        compEvents={competition.events}
        timezone={competition.compDetails.schedule.venues[0].timezone}
      />
    </CompetitionLayout>
  );
};

export default CompetitionSchedule;
