import { IEvent } from '@sh/interfaces';
import { EventGroup } from '@sh/enums';
import Link from 'next/link';

const unofficialEventIcons = [
  'fto',
  // '333-team-bld',
  // '333-oh-bld-team-relay',
  // '333-team-factory',
  // '333bf-2-person-relay',
  // '333bf-3-person-relay',
  // '333bf-4-person-relay',
  // '333bf-8-person-relay',
];

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
  const doShowIcon = showIcon && (isOrWasWCAEvent || unofficialEventIcons.includes(event.eventId));

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
