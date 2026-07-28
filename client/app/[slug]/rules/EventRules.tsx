"use client";

import { useParams } from "next/navigation";
import { use } from "react";
import EventInformation from "~/app/[slug]/rules/EventInformation.tsx";
import { IS_CUBING_CONTESTS_INSTANCE } from "~/helpers/constants.ts";
import type { SelectEvent } from "~/server/db/schema/events.ts";

type Props = {
  eventRulesPromise: Promise<
    [
      Pick<SelectEvent, "eventId" | "name" | "defaultRoundFormat" | "description" | "rule">[],
      Pick<SelectEvent, "eventId" | "name" | "defaultRoundFormat" | "description" | "rule">[],
    ]
  >;
};

function EventRules({ eventRulesPromise }: Props) {
  const [eventsWithRules, eventsOnlyWithDescriptions] = use(eventRulesPromise);
  const { slug }: { slug: string } = useParams();

  return (
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
            These rules apply to each event individually.
            {IS_CUBING_CONTESTS_INSTANCE &&
              " If an event is not listed here, it must follow the most relevant WCA Regulations, based on the nature of the event (i.e. one of the articles from A to F)."}
          </p>
          {eventsWithRules.map((event) => (
            <EventInformation organizationSlug={slug} key={event.eventId} event={event} />
          ))}
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
            These are all available event descriptions, excluding events that have rules. These can be used as reference
            to ensure consistency in how these events are held.
          </p>
          {eventsOnlyWithDescriptions.map((event) => (
            <EventInformation organizationSlug={slug} key={event.eventId} event={event} />
          ))}
        </>
      )}
    </div>
  );
}

export default EventRules;
