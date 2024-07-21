import Tabs from '@c/UI/Tabs';
import { IContest } from '@sh/types';
import { getIsCompType } from '@sh/sharedFunctions';

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
    { title: 'Details', value: 'details', route: `/competitions/${contest.competitionId}` },
    {
      title: 'Results',
      value: 'results',
      route: `/competitions/${contest.competitionId}/results`,
      hidden: !contest.events.some((ev) => ev.rounds.some((r) => r.results.length > 0)),
    },
    { title: 'Events', value: 'events', route: `/competitions/${contest.competitionId}/events` },
    {
      title: 'Schedule',
      value: 'schedule',
      route: `/competitions/${contest.competitionId}/schedule`,
      hidden: !getIsCompType(contest.type),
    },
  ];

  return (
    <div>
      <h2 className="px-2 text-center">{contest.name}</h2>
      <Tabs tabs={tabs} activeTab={activeTab} forServerSidePage />

      {children}
    </div>
  );
};

export default ContestLayout;
