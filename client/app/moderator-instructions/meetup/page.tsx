import Tabs from '@c/UI/Tabs';
import { tabs } from '~/app/moderator-instructions/tabs';

const page = () => {
  return (
    <div>
      <Tabs tabs={tabs} activeTab="meetup" forServerSidePage prefetch />

      <div className="mt-4">
        <p>
          C1. If you are holding a speedcuber meetup, select the <b className="hl">Meetup</b> contest type and fill out
          the meetup details.
        </p>
        <p>
          C2. Instead of a schedule, meetups require a start time, and there is no end date, since meetups can only be
          one day long.
        </p>
      </div>
    </div>
  );
};

export default page;
