import '@cubing/icons';
import { IEvent } from '@sh/interfaces';
import { EventGroup } from '@sh/enums';
import { shortenEventName } from '~/helpers/utilityFunctions';

const unofficialEventIcons = [
  '222bf',
  '234relay',
  '2345relay',
  '23456relay',
  '234567relay',
  '333mts',
  '333_mirror_blocks',
  '333_oh_bld_relay',
  '333_oh_bld_team_relay',
  '333_team_bld',
  '333_team_factory',
  '333bf_2_person_relay',
  '333bf_3_person_relay',
  '333bf_4_person_relay',
  '333bf_8_person_relay',
  '666bf',
  '777bf',
  'curvycopter',
  'fisher',
  'fto',
  'helicopter',
  'kilominx',
  'miniguild',
  'mpyram',
  'mskewb',
  'mtetram',
  'pyramorphix',
  'redi',
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
        {shortenEventName(event.name)}
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
