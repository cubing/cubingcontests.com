import Tabs from '@c/UI/Tabs';
import { tabs } from '~/app/moderator-instructions/tabs';

const page = () => {
  return (
    <div>
      <Tabs tabs={tabs} activeTab="unofficial" forServerSidePage prefetch />

      <div className="mt-4">
        <p>
          B1. If you are holding an unofficial competition, this works almost the same way as hosting unofficial events
          at a WCA competition, except you must use the <b className="hl">Competition</b> contest type and fill out the
          contest details manually. Both WCA events and unofficial events may be held at these kinds of competitions.
        </p>
        <p>
          B2. Unofficial competitions are <b>only</b> allowed if they cannot reasonably be held as official WCA
          competitions. Please <b>DO NOT</b> attempt to use Cubing Contests as a substitute for the WCA. Your
          competition may be rejected if it is deemed that it could be held as a WCA competition instead.
        </p>
      </div>
    </div>
  );
};

export default page;
