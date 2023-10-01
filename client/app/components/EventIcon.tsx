import '@cubing/icons';
import { IEvent } from '@sh/interfaces';
import { EventGroup } from '@sh/enums';

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
  const eventName = event.name
    .replaceAll(/2x2x2/g, '2x2')
    .replaceAll(/3x3x3/g, '3x3')
    .replaceAll(/4x4x4/g, '4x4')
    .replaceAll(/5x5x5/g, '5x5')
    .replaceAll(/6x6x6/g, '6x6')
    .replaceAll(/7x7x7/g, '7x7')
    .replaceAll(/8x8x8/g, '8x8')
    .replaceAll(/9x9x9/g, '9x9')
    .replace('Blindfolded', 'BLD')
    .replace('One-Handed', 'OH')
    .replace('Without', 'No')
    .replace(' Cuboid', '')
    .replace(' Challenge', '');

  if (!iconExists) {
    if (!onClick) return <></>;

    return (
      <button
        type="button"
        className={'btn btn-light btn-sm m-1' + (isActive ? ' active' : '')}
        onClick={() => onClick(event.eventId)}
      >
        {eventName}
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
