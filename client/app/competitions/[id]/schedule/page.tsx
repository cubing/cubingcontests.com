import { ssrFetch } from "~/helpers/DELETEfetchUtils.ts";
import ContestLayout from "~/app/competitions/ContestLayout.tsx";
import Schedule from "~/app/components/Schedule.tsx";
import { type ICompetitionDetails } from "~/helpers/types.ts";
import { C } from "~/helpers/constants";

type Props = {
  params: Promise<{ id: string }>;
};

const CompetitionSchedulePage = async ({ params }: Props) => {
  const { id } = await params;
  const contestDataResponse = await ssrFetch(`/competitions/${id}`, { revalidate: C.contestsRev });
  if (!contestDataResponse.success) {
    return <h3 className="mt-4 text-center">Error while loading contest</h3>;
  }
  const { contest } = contestDataResponse.data;

  return (
    <ContestLayout contest={contest} activeTab="schedule">
      <Schedule
        rooms={(contest.compDetails as ICompetitionDetails).schedule.venues[0]
          .rooms}
        contestEvents={contest.events}
        timeZone={(contest.compDetails as ICompetitionDetails).schedule
          .venues[0].timezone}
      />
    </ContestLayout>
  );
};

export default CompetitionSchedulePage;
