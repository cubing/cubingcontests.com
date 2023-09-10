import Link from 'next/link';
import EventIcon from './EventIcon';
import { IEvent } from '@sh/interfaces';

const EventTitle = ({
  event,
  showIcon = false,
  linkToRankings = false,
}: {
  event: IEvent;
  showIcon?: boolean;
  linkToRankings?: boolean;
}) => {
  return (
    <h3 className="d-flex align-items-center gap-2 mb-3 mx-2">
      {showIcon && <EventIcon event={event} />}

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
