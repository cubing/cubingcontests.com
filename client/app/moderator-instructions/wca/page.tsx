import Tabs from "~/app/components/UI/Tabs.tsx";
import Link from "next/link";
import { tabs } from "~/app/moderator-instructions/tabs.ts";

const page = () => {
  return (
    <>
      <Tabs tabs={tabs} activeTab="wca" forServerSidePage prefetch />

      <div className="mt-4">
        <p>
          A1. If you are holding unofficial events at a WCA competition, first you must wait until it's approved on the
          WCA website. Then you can click on{" "}
          <b className="hl">Create new contest</b>, enter the ID of the competition from the WCA website, select the
          {" "}
          <b className="hl">WCA Competition</b> contest type, and click{" "}
          <b className="hl">Get WCA competition details</b>. The website may return an error, saying that the
          competition is not found, if not enough time has passed after it got published on the WCA website. In that
          case, simply try again the following day.
        </p>
        <p>
          A2. Edit the editable fields, if necessary. All users with moderator privileges who are listed as organizers
          on the contest page will have access to edit it and do data entry. Use the description input to add additional
          details, if necessary. The description supports Markdown links, so you can add them using this syntax:
          [display text](link).
        </p>
        <p>
          A3. Go to the Events tab and select all unofficial events and rounds you would like to hold. Please think this
          part through carefully, because it will not be possible to change the format for a round after the competition
          is approved without direct admin intervention. As such, changing formats is <b>highly</b>{" "}
          discouraged. You may add additional rounds after the contest is approved yourself if you have the time for it,
          but adding an event requires admin approval. If you would like to hold a brand <b>new event</b>,{" "}
          you may request for it to be added, but this should be done before your contest is approved.
        </p>
        <p>
          A4. Go to the Schedule tab and add all rounds to the schedule. You must first enter the rooms and then add the
          schedule activities with the correct room selected for each round. Custom activities can also be added (e.g.
          Lunch).
        </p>
        <p>
          A5. Click{" "}
          <b className="hl">Create Contest</b>, open the competition page and make sure everything looks right. After
          you have done that, you will need to add a link to the newly-created competition to the WCA competition page.
          It is recommended to add that link and any relevant information to a dedicated "Unofficial Events" tab. Then
          wait for an admin to approve the competition, at which point it will become visible on the Contests page on
          the website. You may still edit some of the details after creation, if necessary.
        </p>
        <p>
          A6. Make sure your contests follow the <Link href="/rules">rules</Link>{" "}
          (while the results on Cubing Contests are considered unofficial, we still strive to ensure consistency and
          fairness). To generate the scorecards, you can click <b className="hl">Edit</b> and click{" "}
          <b className="hl">Scorecards</b>{" "}
          (this button becomes available after the contest gets approved). Since there is no registration through Cubing
          Contests yet, the names won't be filled in and there are no groups, but there is one page for each round of
          each event. You can print as many copies of each page as you need for the corresponding rounds, and ask the
          competitors to fill their names in by hand when submitting their puzzles. Keep in mind that all names must be
          filled in for team events, but a signature from just one of the competitors on a team is enough.
        </p>
        <p>
          A7. To do data entry, click <b className="hl">Results</b>{" "}
          on the moderator dashboard, select the event and round, and start entering results. The tooltips explain how
          to enter competitors and results. If you would like to add a competitor without a WCA ID, and they aren't
          already in the Cubing Contests database, you can add new competitors on the{" "}
          <b className="hl">Add New Competitor</b>{" "}
          page. You can access this page from the moderator dashboard, or by clicking{" "}
          <b className="hl">(add new person)</b>{" "}
          when searching for a competitor in the competitor input. Data entry can be done entirely using the keyboard.
        </p>
        <p>
          A8. Once you have entered all results and finished double-checking, click <b className="hl">Finish</b>{" "}
          on the moderator dashboard. Once an admin publishes the competition, the results will be included in the
          rankings.
        </p>
      </div>
    </>
  );
};

export default page;
