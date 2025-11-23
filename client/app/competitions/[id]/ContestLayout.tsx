import Tabs from "~/app/components/UI/Tabs.tsx";
import { getIsCompType } from "~/helpers/sharedFunctions.ts";
import type { ContestResponse } from "~/server/db/schema/contests.ts";

type Props = {
  contest: ContestResponse;
  activeTab: string;
  children: React.ReactNode;
};

function ContestLayout({ contest, activeTab, children }: Props) {
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
    <section className="mb-4">
      <h2 className="mb-3 px-3 text-center">{contest.name}</h2>
      <Tabs tabs={tabs} activeTab={activeTab} forServerSidePage replace />

      {children}
    </section>
  );
}

export default ContestLayout;
