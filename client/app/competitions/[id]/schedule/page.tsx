import ContestLayout from "~/app/competitions/[id]/ContestLayout.tsx";
import Schedule from "~/app/components/Schedule.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";

type Props = {
  params: Promise<{ id: string }>;
};

const CompetitionSchedulePage = async ({ params }: Props) => {
  const { id } = await params;
  const contestDataResponse = await ssrFetch(`/competitions/${id}`);
  if (!contestDataResponse.success) <LoadingError loadingEntity="contest" />;
  const { contest } = contestDataResponse.data;

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
