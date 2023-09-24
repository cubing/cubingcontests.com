import Tabs from './Tabs';
import { ContestType } from '@sh/enums';
import { IContest } from '@sh/interfaces';

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
    { title: `Details`, value: `details`, route: `/competitions/${contest.competitionId}` },
    {
      title: `Results`,
      value: `results`,
      route: `/competitions/${contest.competitionId}/results`,
      hidden: !contest.events.some((ev) => ev.rounds.some((r) => r.results.length > 0)),
    },
    { title: `Events`, value: `events`, route: `/competitions/${contest.competitionId}/events` },
    {
      title: `Schedule`,
      value: `schedule`,
      route: `/competitions/${contest.competitionId}/schedule`,
      hidden: contest.type !== ContestType.Competition,
    },
  ];

  return (
    <div>
      <h2 className="text-center lh-base">{contest.name}</h2>
      <Tabs tabs={tabs} activeTab={activeTab} forServerSidePage />

      {children}
    </div>
  );
};

export default ContestLayout;
