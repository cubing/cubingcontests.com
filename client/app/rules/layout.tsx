import Markdown from "react-markdown";
import { type FeEvent, type IRoundFormat } from "~/helpers/types.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { EventGroup, RoundFormat } from "~/helpers/enums.ts";
import EventTitle from "~/app/components/EventTitle.tsx";
import { ssrFetch } from "~/helpers/fetchUtils.ts";

type Props = {
  children: React.ReactNode;
};

const RulesLayout = async ({ children }: Props) => {
  const eventsResponse = await ssrFetch<FeEvent[]>("/events/with-rules");

  if (!eventsResponse.success) {
    return <h4 className="mt-4 text-center">Error while loading events</h4>;
  }

  const events = eventsResponse.data.filter((e) => !e.groups.includes(EventGroup.Hidden));

  return (
    <div>
      <h2 className="mb-4 text-center">Rules</h2>

      {children}

      <div className="px-3">
        {events.length > 0 && (
          <>
            <hr />
            <h3>Event rules</h3>
            <p>
              These rules apply to each event individually. If an event is not listed here, it must follow the most
              relevant WCA Regulations, based on the nature of the event (i.e. one of the articles from A to F).
            </p>
            {events.map((event: FeEvent) => {
              const roundFormat = roundFormats.find((rf) => rf.value === event.defaultRoundFormat) as IRoundFormat;
              const rankedFormat = roundFormat.value === RoundFormat.Average ? roundFormat : roundFormats[3];

              return (
                <div key={event.eventId} className="mt-4">
                  <EventTitle
                    event={event}
                    fontSize="4"
                    showIcon
                    linkToRankings
                  />
                  <div style={{ overflowX: "auto" }}>
                    <Markdown>{event.ruleText}</Markdown>
                  </div>
                  <p className="mb-1">
                    The ranked average format is <b>{rankedFormat.label}</b>
                  </p>
                  {roundFormat.value !== rankedFormat.value && (
                    <p>
                      The default round format is <b>{roundFormat.label}</b>
                    </p>
                  )}
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
};

export default RulesLayout;
