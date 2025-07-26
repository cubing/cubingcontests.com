import Markdown from "react-markdown";
import { roundFormats } from "~/helpers/roundFormats.ts";
import EventTitle from "~/app/components/EventTitle.tsx";
import { db } from "~/server/db/provider.ts";
import { eventsTable as table } from "~/server/db/schema/events.ts";
import { isNotNull } from "drizzle-orm";

type Props = {
  children: React.ReactNode;
};

async function RulesLayout({ children }: Props) {
  const events = await db.select().from(table).where(isNotNull(table.rule)).orderBy(table.rank);

  return (
    <div>
      <h2 className="mb-4 text-center">Rules</h2>

      {children}

      <div className="px-3">
        <hr />
        <h3>Event rules</h3>

        {events.length === 0 ? <p>No events found</p> : (
          <>
            <p>
              These rules apply to each event individually. If an event is not listed here, it must follow the most
              relevant WCA Regulations, based on the nature of the event (i.e. one of the articles from A to F).
            </p>
            {events.map((event) => {
              const roundFormat = roundFormats.find((rf) => rf.value === event.defaultRoundFormat)!;
              const rankedFormat = roundFormat.value === "a"
                ? roundFormat
                : roundFormats.find((rf) => rf.value === "m");

              return (
                <div key={event.eventId} className="mt-4">
                  <EventTitle
                    event={event}
                    fontSize="4"
                    showIcon
                    linkToRankings
                  />
                  <div style={{ overflowX: "auto" }}>
                    <Markdown>{event.rule}</Markdown>
                  </div>
                  <p className="mb-1">
                    The ranked average format is <b>{rankedFormat.label}</b>
                  </p>
                  <p>
                    The default round format is <b>{roundFormat.label}</b>
                  </p>
                </div>
              );
            })}
          </>
        )}

        <hr />
        <h3>License</h3>
        <p>
          The contents of this page are available under the{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">
            CC Attribution-ShareAlike 4.0 International
          </a>{" "}
          license.
        </p>
      </div>
    </div>
  );
}

export default RulesLayout;
