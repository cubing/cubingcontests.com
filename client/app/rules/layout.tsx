import Markdown from "react-markdown";
import { type IFeEvent, type IRoundFormat } from "~/shared_helpers/types.ts";
import { roundFormats } from "~/shared_helpers/roundFormats.ts";
import { RoundFormat } from "~/shared_helpers/enums.ts";
import EventTitle from "~/app/components/EventTitle.tsx";
import { ssrFetch } from "~/helpers/fetchUtils.ts";

type Props = {
  children: React.ReactNode;
};

const RulesLayout = async ({ children }: Props) => {
  const { payload: events } = await ssrFetch("/events/with-rules");

  if (!events) return <h4 className="mt-4 text-center">Error while loading events</h4>;

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
            {events.map((event: IFeEvent) => {
              const roundFormat = roundFormats.find((rf) => rf.value === event.defaultRoundFormat) as IRoundFormat;
              const rankedFormat = roundFormat.value === RoundFormat.Average ? roundFormat : roundFormats[3];

              return (
                <div key={event.eventId} className="mt-4">
                  <EventTitle event={event} fontSize="4" showIcon linkToRankings />
                  <Markdown>{event.ruleText}</Markdown>
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
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC Attribution-ShareAlike 4.0 International</a>{" "}
          license.
        </p>
      </div>
    </div>
  );
};

export default RulesLayout;
