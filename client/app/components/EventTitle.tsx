import { IEvent } from '@sh/interfaces';
import { EventGroup } from '@sh/enums';
import Link from 'next/link';

const EventTitle = ({
  event,
  showIcon = false,
  linkToRankings = false,
}: {
  event: IEvent;
  showIcon?: boolean;
  linkToRankings?: boolean;
}) => {
  const isOrWasWCAEvent = event.groups.includes(EventGroup.WCA) || event.groups.includes(EventGroup.RemovedWCA);
  const doShowIcon = showIcon && (isOrWasWCAEvent || ['fto'].includes(event.eventId));

  return (
    <h3 className="d-flex align-items-center mb-3 mx-2">
      {doShowIcon && (
        <span className={`cubing-icon ${isOrWasWCAEvent ? 'event' : 'unofficial'}-${event.eventId} me-2`}></span>
      )}
      {!linkToRankings ? (
        event.name
      ) : (
        <Link
          href={`/rankings/${event.eventId}/single`}
          className="link-light link-underline-opacity-0 link-underline-opacity-100-hover"
        >
          {event.name}
        </Link>
      )}
    </h3>
  );
};

export default EventTitle;
