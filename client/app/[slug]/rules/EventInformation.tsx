import Markdown from "react-markdown";
import EventTitle from "~/app/components/EventTitle.tsx";
import { roundFormats } from "~/helpers/roundFormats.ts";
import type { FullEvent } from "~/server/db/schema/events.ts";

type Props = {
  organizationSlug: string;
  event: Pick<FullEvent, "eventId" | "name" | "defaultRoundFormat" | "description" | "rule">;
};

function EventInformation({ organizationSlug, event }: Props) {
  const defaultRoundFormat = roundFormats.find((rf) => rf.value === event.defaultRoundFormat)!;
  const rankedAverageFormat = roundFormats.find((rf) => rf.value === defaultRoundFormat.rankedAverageFormat)!;

  return (
    <div key={event.eventId} className="mt-4">
      <EventTitle organizationSlug={organizationSlug} event={event} fontSize="4" showIcon linkToRankings />
      {event.rule && (
        <div style={{ overflowX: "auto" }}>
          <Markdown>{event.rule}</Markdown>
        </div>
      )}
      {event.description && (
        <p className="mb-3">
          <span className="fw-bold">Description:</span> {event.description}
        </p>
      )}
      <p>
        The ranked average format
        {defaultRoundFormat.value === rankedAverageFormat.value ? " and the default round format" : ""} is{" "}
        <b>{rankedAverageFormat.label}</b>
      </p>
      {defaultRoundFormat.value !== rankedAverageFormat.value && (
        <p className="mb-1">
          The default round format is <b>{defaultRoundFormat.label}</b>
        </p>
      )}
    </div>
  );
}

export default EventInformation;
