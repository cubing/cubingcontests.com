import Link from 'next/link';
import C from '@sh/constants';

const ModeratorInstructions = () => {
  return (
    <div className="pb-4">
      <h3 className="mb-5 text-center">How to hold a contest</h3>

      <p className="mb-5">
        If you would like to host unofficial events for a WCA competition (A) or create an unofficial competition (B) or
        meetup (C), follow these steps:
      </p>
      <p>
        1. <Link href="/register">Create an account</Link> and send an email to {C.contactEmail} with your username and
        WCA ID.
      </p>
      <p className="mb-5">
        2. Once an admin grants you moderator privileges and ties your competitor profile to your account, log out and
        log back in. You will now be able to find the "Mod Dashboard" button in the user section in the navbar. Go to
        that page.
      </p>
      <p>
        A1. If you are hosting unofficial events for a WCA competition, first you must wait until it's approved on the
        WCA website. Then you can click on "Create new contest", enter the ID of the competition from the WCA website,
        select the competition contest type, and click "Get WCA competition details".
      </p>
      <p>
        A2. Edit the editable fields, if necessary. You can also add additional organizers (e.g. those who are
        organizing the unofficial events, but aren't listed on the WCA page). All users with moderator privileges who
        are listed here will have access to edit the competition and do data entry. Use the description input to add
        additional details, if necessary. The description supports Markdown links, so you can add them using this
        syntax: [text](link).
      </p>
      <p>A3. Go to the "Events" tab and select all events and rounds you would like to hold.</p>
      <p>
        A4. Go to the "Schedule" tab and add all rounds to the schedule. You must first enter the rooms and then add the
        schedule activities with the correct room selected for each round. Custom activities can also be added.
      </p>
      <p>
        A5. Click "Create Contest" and wait for an admin to approve the competition, at which point it will become
        visible on the "Contests" page on the website. You may still edit some of the details after creation.
      </p>
      <p>
        A6. Once the competition is approved, you should create an "Unofficial Events" tab on the competition's WCA page
        and add some information for competitors, as well as a link to the Cubing Contests competition page.
      </p>
      <p>
        A7. To do data entry, click "Results" on the moderator dashboard, select the event and round, and start entering
        results. The tooltips explain how to enter competitors and results. If you would like to add a competitor
        without a WCA ID, and they aren't already in the Cubing Contests database, you can add new competitors on the
        "Add New Competitor" page. You can access this page from the moderator dashboard, or by clicking (add new
        person) when searching for a competitor in the competitor input. Data entry can be fully done using just the
        keyboard.
      </p>
      <p className="mb-5">
        A8. Once you have entered all results and finished double-checking, click "Finish" on the moderator dashboard.
        Once an admin publishes the competition, the results will be included in the rankings.
      </p>
      <p className="mb-5">
        B1. If you are hosting an unofficial competition, this works almost the same way as hosting unofficial events
        for a WCA competition, except you don't need to use the "Get WCA competition details" button. Instead, you must
        fill out the details manually.
      </p>
      <p>C1. This is a work in progress...</p>
    </div>
  );
};

export default ModeratorInstructions;
