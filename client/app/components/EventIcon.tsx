import '@cubing/icons';
import { IEvent } from '~/shared_helpers/types.ts';
import { EventGroup } from '~/shared_helpers/enums.ts';
import { shortenEventName } from '~/helpers/utilityFunctions.ts';

const unofficialEventIcons = [
  '222bf',
  '222oh',
  '234relay',
  '2345relay',
  '23456relay',
  '234567relay',
  '333mts',
  '333_mirror_blocks',
  '333_mirror_blocks_bld',
  '333_oh_bld_relay',
  '333_oh_bld_team_relay',
  '333_speed_bld',
  '333_linear_fm',
  '333_team_bld',
  '333_team_factory',
  '333bf_2_person_relay',
  '333bf_3_person_relay',
  '333bf_4_person_relay',
  '333bf_8_person_relay',
  '444ft',
  '666bf',
  '777bf',
  'curvycopter',
  'fisher',
  'fto',
  'helicopter',
  'kilominx',
  'miniguild',
  'miniguild_2_person',
  'miniguild_bld',
  'mpyram',
  'mskewb',
  'mtetram',
  'pyramorphix',
  'redi',
];

const EventIcon = (
  { event, onClick, isActive }: {
    event: IEvent;
    onClick?: () => void;
    isActive?: boolean;
  },
) => {
  const isOrWasWCAEvent = event.groups.includes(EventGroup.WCA) ||
    event.groups.includes(EventGroup.RemovedWCA);
  const iconExists = isOrWasWCAEvent ||
    unofficialEventIcons.includes(event.eventId);

  if (!iconExists) {
    if (!onClick) return <></>;

    return (
      <button
        type='button'
        onClick={onClick}
        className={'btn btn-lightdark btn-sm m-1' + (isActive ? ' active' : '')}
      >
        {shortenEventName(event.name)}
      </button>
    );
  }

  if (!onClick) {
    return (
      <span
        className={`cubing-icon ${isOrWasWCAEvent ? 'event' : 'unofficial'}-${event.eventId}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={'cc-icon-button' + (isActive ? ' cc-icon-button--active' : '')}
    >
      <span
        className={`cubing-icon ${isOrWasWCAEvent ? 'event' : 'unofficial'}-${event.eventId}`}
      />
    </div>
  );
};

export default EventIcon;
