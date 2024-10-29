import Tabs from "~/app/components/UI/Tabs.tsx";
import { IContest } from "~/shared_helpers/types.ts";
import { getIsCompType } from "~/shared_helpers/sharedFunctions.ts";

const ContestLayout = ({
  contest,
  activeTab,
  children,
}: {
  contest: IContest;
  activeTab: string;
  children: React.ReactNode;
}) => {
  const tabs = [
    {
      title: "Details",
      value: "details",
      route: `/competitions/${contest.competitionId}`,
    },
    {
      title: "Results",
      value: "results",
      route: `/competitions/${contest.competitionId}/results`,
      hidden: !contest.events.some((ev) => ev.rounds.some((r) => r.results.length > 0)),
    },
    {
      title: "Events",
      value: "events",
      route: `/competitions/${contest.competitionId}/events`,
    },
    {
      title: "Schedule",
      value: "schedule",
      route: `/competitions/${contest.competitionId}/schedule`,
      hidden: !getIsCompType(contest.type),
    },
  ];

  return (
    <div className="mb-4">
      <h2 className="mb-3 px-2 text-center">{contest.name}</h2>
      <Tabs tabs={tabs} activeTab={activeTab} forServerSidePage replace />

      {children}
    </div>
  );
};

export default ContestLayout;
