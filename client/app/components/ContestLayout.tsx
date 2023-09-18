import Tabs from './Tabs';
import { IContest } from '@sh/interfaces';

const ContestLayout = ({
  competition,
  activeTab,
  children,
}: {
  competition: IContest;
  activeTab: string;
  children: React.ReactNode;
}) => {
  const tabs = [
    { title: 'Details', value: 'details', route: `/competitions/${competition.competitionId}` },
    {
      title: 'Results',
      value: 'results',
      route: `/competitions/${competition.competitionId}/results`,
      hidden: !competition.events.some((ev) => ev.rounds.some((r) => r.results.length > 0)),
    },
    { title: 'Events', value: 'events', route: `/competitions/${competition.competitionId}/events` },
    { title: 'Schedule', value: 'schedule', route: `/competitions/${competition.competitionId}/schedule` },
  ];

  return (
    <div>
      <h2 className="text-center lh-base">{competition.name}</h2>
      <Tabs tabs={tabs} activeTab={activeTab} forServerSidePage />

      {children}
    </div>
  );
};

export default ContestLayout;
