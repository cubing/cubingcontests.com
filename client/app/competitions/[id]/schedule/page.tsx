import { ssrFetch } from "~/helpers/fetchUtils.ts";
import ContestLayout from "~/app/competitions/ContestLayout.tsx";
import Schedule from "~/app/components/Schedule.tsx";
import { IContest } from "../../../../shared_helpers/types.ts";

const CompetitionSchedulePage = async (
  { params }: { params: { id: string } },
) => {
  const { payload: contestData } = await ssrFetch(`/competitions/${params.id}`);
  if (!contestData) {
    return <h3 className="mt-4 text-center">Contest not found</h3>;
  }
  const { contest }: { contest: IContest } = contestData;

  return (
    <ContestLayout contest={contest} activeTab="schedule">
      <Schedule
        rooms={contest.compDetails.schedule.venues[0].rooms}
        contestEvents={contest.events}
        timeZone={contest.compDetails.schedule.venues[0].timezone}
      />
    </ContestLayout>
  );
};

export default CompetitionSchedulePage;
