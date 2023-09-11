import { IEvent } from '@sh/interfaces';
import { EventGroup } from '@sh/enums';

const unofficialEventIcons = [
  'fto',
  '333-team-bld',
  '333-team-factory',
  '333-oh-bld-team-relay',
  '333bf-2-person-relay',
  '333bf-3-person-relay',
  '333bf-4-person-relay',
  '333bf-8-person-relay',
  '666bf',
  '777bf',
];

const EventIcon = ({
  event,
  onClick,
  isActive = false,
}: {
  event: IEvent;
  onClick?: (eventId: string) => void;
  isActive?: boolean;
}) => {
  const isOrWasWCAEvent = event.groups.includes(EventGroup.WCA) || event.groups.includes(EventGroup.RemovedWCA);
  const iconExists = isOrWasWCAEvent || unofficialEventIcons.includes(event.eventId);

  if (!iconExists) {
    if (!onClick) return <></>;

    return (
      <button
        type="button"
        className={'btn btn-light btn-sm m-1' + (isActive ? ' active' : '')}
        onClick={() => onClick(event.eventId)}
      >
        {event.name.replace('3x3x3', '3x3').replace('Blindfolded', 'BLD').replace('man Relay', 'man')}
      </button>
    );
  }

  if (!onClick) return <span className={`cubing-icon ${isOrWasWCAEvent ? 'event' : 'unofficial'}-${event.eventId}`} />;

  return (
    <div
      className={'cc-icon-button' + (isActive ? ' cc-icon-button_active' : '')}
      onClick={() => onClick(event.eventId)}
    >
      <span className={`cubing-icon ${isOrWasWCAEvent ? 'event' : 'unofficial'}-${event.eventId}`} />
    </div>
  );
};

export default EventIcon;
