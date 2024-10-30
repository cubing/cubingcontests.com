import Tabs from "~/app/components/UI/Tabs.tsx";
import Link from "next/link";
import { tabs } from "~/app/moderator-instructions/tabs.ts";

const page = () => {
  return (
    <div>
      <Tabs tabs={tabs} activeTab="meetup" forServerSidePage prefetch />

      <div className="mt-4">
        <p>
          C1. If you are holding a speedcuber meetup, select the <b className="hl">Meetup</b>{" "}
          contest type and fill out the meetup details.
        </p>
        <p>
          C2. Instead of a schedule, meetups require a start time, and there is no end date, since meetups can only be
          one day long.
        </p>
        <p>
          C3. The rest of the process is the same as <Link href="wca">{tabs[0].title}</Link>.
        </p>
      </div>
    </div>
  );
};

export default page;
