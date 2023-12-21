import Link from 'next/link';
import C from '@sh/constants';

const ModeratorInstructions = () => {
  return (
    <div className="px-3 pb-4">
      <h3 className="mb-4 text-center">How to hold a contest</h3>

      <p>
        If you would like to hold unofficial events at a WCA competition (A) or create an unofficial competition (B) or
        meetup (C), follow these steps:
      </p>
      <div style={{ height: '1rem' }} />
      <p>
        1. <Link href="/register">Create an account</Link> and send an email to {C.contactEmail} with this information:
      </p>
      <p>1.1. Username</p>
      <p>1.2. WCA ID</p>
      <p>1.3. Name of the competition/meetup you are organizing</p>
      <p>
        2. Once an admin grants you moderator privileges and ties your competitor profile to your account, log out and
        log back in. You will now be able to find the "Mod Dashboard" button in the user section in the navbar. Go to
        that page.
      </p>
      <div style={{ height: '1rem' }} />
      <p>
        A1. If you are holding unofficial events at a WCA competition, first you must wait until it's approved on the
        WCA website. Then you can click on "Create new contest", enter the ID of the competition from the WCA website,
        select the "WCA Competition" contest type, and click "Get WCA competition details".
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
        A5. Click "Create Contest", open the competition page and make sure everything looks right. After you have done
        that, You will need to add a link to the newly-created competition to the WCA competition page. It is
        recommended to add the link to a dedicated "Unofficial Events" tab. Then wait for an admin to approve the
        competition, at which point it will become visible on the "Contests" page on the website. You may still edit
        some of the details after creation.
      </p>
      <p>
        A6. You can use the{' '}
        <a href="https://experiments.cubing.net/cubing.js/mark3/" target="_blank">
          Cubing JS scramble generator
        </a>
        to generate the scrambles, even for some unofficial events. To generate the scorecards, you can click "Edit" on
        the needed contest and click "Scorecards" (this button becomes available once the contest gets approved). Since
        there is no registration through Cubing Contests yet, the names won't be filled in and there are no groups, but
        there is one page for each round for each event. You can print as many copies of each page as you need for the
        corresponding rounds and ask the competitors to fill their names in when submitting their puzzles. Keep in mind
        that all names must be filled in for team events, but a signature from just one of the competitors on a team is
        enough.
      </p>
      <p>
        A7. To do data entry, click "Results" on the moderator dashboard, select the event and round, and start entering
        results. The tooltips explain how to enter competitors and results. If you would like to add a competitor
        without a WCA ID, and they aren't already in the Cubing Contests database, you can add new competitors on the
        "Add New Competitor" page. You can access this page from the moderator dashboard, or by clicking (add new
        person) when searching for a competitor in the competitor input. Data entry can be fully done using just the
        keyboard.
      </p>
      <p>
        A8. Once you have entered all results and finished double-checking, click "Finish" on the moderator dashboard.
        Once an admin publishes the competition, the results will be included in the rankings.
      </p>
      <div style={{ height: '1rem' }} />
      <p>
        B1. If you are holding an unofficial competition, this works almost the same way as hosting unofficial events at
        a WCA competition, except you must use the "Competition" contest type and fill out the contest details manually.
      </p>
      <div style={{ height: '1rem' }} />
      <p>
        C1. If you are holding a speedcuber meetup, select the "Meetup" contest type and fill out the meetup details.
      </p>
      <p>
        C2. Instead of a schedule, meetups require a start time, and there is no end date, since meetups can only be one
        day long.
      </p>
    </div>
  );
};

export default ModeratorInstructions;
