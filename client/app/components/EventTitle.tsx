import Link from 'next/link';
import EventIcon from './EventIcon';
import { IEvent } from '@sh/interfaces';
import Tooltip from '@c/UI/Tooltip';

const EventTitle = ({
  event,
  showIcon = false,
  showDescription = false,
  linkToRankings = false,
  noMargin = false,
  fontSize = '3',
}: {
  event: IEvent;
  showIcon?: boolean;
  showDescription?: boolean;
  linkToRankings?: boolean;
  noMargin?: boolean;
  fontSize?: '1' | '2' | '3' | '4' | '5' | '6';
}) => {
  return (
    <h3 className={`d-flex align-items-center gap-2 fs-${fontSize} ${noMargin ? ' m-0' : ' mx-2 mb-3'}`}>
      {showIcon && <EventIcon event={event} />}

      {!linkToRankings ? (
        event.name
      ) : (
        <Link
          href={`/rankings/${event.eventId}/single`}
          prefetch={false}
          className="link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover"
          style={{ maxWidth: '80vw' }}
        >
          {event.name}
        </Link>
      )}

      {showDescription && event.description && <Tooltip id={`${event.eventId}_tooltip`} text={event.description} />}
    </h3>
  );
};

export default EventTitle;
