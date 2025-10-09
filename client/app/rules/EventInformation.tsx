import Markdown from "react-markdown";
import EventTitle from "~/app/components/EventTitle.tsx";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { SelectEvent } from "~/server/db/schema/events.ts";

type Props = {
  event: SelectEvent;
};

function EventInformation({ event }: Props) {
  const roundFormat = roundFormats.find((rf) => rf.value === event.defaultRoundFormat)!;
  const rankedFormat = roundFormat.value === "a" ? roundFormat : roundFormats[3];

  return (
    <div key={event.eventId} className="mt-4">
      <EventTitle event={event} fontSize="4" showIcon linkToRankings />
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
}

export default EventInformation;
