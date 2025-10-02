import type { FeEvent } from "~/helpers/types.ts";
import { ssrFetch } from "~/helpers/fetchUtils.ts";
import EventInformation from "~/app/rules/EventInformation";

type Props = {
  children: React.ReactNode;
};

const RulesLayout = async ({ children }: Props) => {
  const eventsResponse = await ssrFetch<FeEvent[]>("/events/with-rules");

  if (!eventsResponse.success) {
    return <h4 className="mt-4 text-center">Error while loading events</h4>;
  }

  const eventsWithRules = [];
  const eventsOnlyWithDescriptions = [];

  for (const event of eventsResponse.data) {
    if (event.ruleText) eventsWithRules.push(event);
    else if (event.description) eventsOnlyWithDescriptions.push(event);
  }

  return (
    <div>
      <h2 className="mb-4 text-center">Rules</h2>

      {children}

      <div className="px-3">
        {eventsWithRules.length > 0 && (
          <>
            <hr />
            <a
              id="event-rules"
              href="#event-rules"
              className="link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover"
            >
              <h3>Event rules</h3>
            </a>
            <p>
              These rules apply to each event individually. If an event is not listed here, it must follow the most
              relevant WCA Regulations, based on the nature of the event (i.e. one of the articles from A to F).
            </p>
            {eventsWithRules.map((event) => <EventInformation key={event.eventId} event={event} />)}
          </>
        )}
        {eventsOnlyWithDescriptions.length > 0 && (
          <>
            <hr />
            <a
              id="event-descriptions"
              href="#event-descriptions"
              className="link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover"
            >
              <h3>Event descriptions</h3>
            </a>
            <p>
              These are all available event descriptions, excluding events that have rules. These can be used as
              reference to ensure consistency in how these events are held.
            </p>
            {eventsOnlyWithDescriptions.map((event) => <EventInformation key={event.eventId} event={event} />)}
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
