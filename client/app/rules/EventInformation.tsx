import Markdown from "react-markdown";
import EventTitle from "~/app/components/EventTitle";
import { RoundFormat } from "~/helpers/enums";
import { roundFormats } from "~/helpers/roundFormats";
import { FeEvent } from "~/helpers/types";

type Props = {
  event: FeEvent;
};

function EventInformation({ event }: Props) {
  const roundFormat = roundFormats.find((rf) => rf.value === event.defaultRoundFormat)!;
  const rankedFormat = roundFormat.value === RoundFormat.Average ? roundFormat : roundFormats[3];

  return (
    <div key={event.eventId} className="mt-4">
      <EventTitle event={event} fontSize="4" showIcon linkToRankings />
      {event.ruleText && (
        <div style={{ overflowX: "auto" }}>
          <Markdown>{event.ruleText}</Markdown>
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
