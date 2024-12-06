import { ssrFetch } from "~/helpers/fetchUtils.ts";
import ContestLayout from "~/app/competitions/ContestLayout.tsx";
import Schedule from "~/app/components/Schedule.tsx";
import { type ICompetitionDetails, IContest } from "~/shared_helpers/types.ts";

type Props = {
  params: { id: string };
};

const CompetitionSchedulePage = async ({ params }: Props) => {
  const { payload: contestData } = await ssrFetch(`/competitions/${params.id}`);
  if (!contestData) return <h3 className="mt-4 text-center">Error while loading contest</h3>;
  const { contest }: { contest: IContest } = contestData;

  return (
    <ContestLayout contest={contest} activeTab="schedule">
      <Schedule
        rooms={(contest.compDetails as ICompetitionDetails).schedule.venues[0].rooms}
        contestEvents={contest.events}
        timeZone={(contest.compDetails as ICompetitionDetails).schedule.venues[0].timezone}
      />
    </ContestLayout>
  );
};

export default CompetitionSchedulePage;
