import Link from 'next/link';
import EventIcon from './EventIcon';
import { IEvent } from '@sh/interfaces';
import { FaQuestionCircle } from 'react-icons/fa';
import Tooltip from './Tooltip';

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
          className="link-light link-underline-opacity-0 link-underline-opacity-100-hover"
        >
          {event.name}
        </Link>
      )}

      {showDescription && event.description && (
        <Tooltip id={`${event.eventId}_tooltip`} text={event.description}>
          <FaQuestionCircle className="fs-6" style={{ color: 'var(--bs-gray-500)' }} />
        </Tooltip>
      )}
    </h3>
  );
};

export default EventTitle;
