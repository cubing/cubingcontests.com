'use client';

import '@cubing/icons';
import { useMemo, useState } from 'react';
import { IEvent } from '@sh/interfaces';
import { EventGroup } from '@sh/enums';
import { eventCategories } from '~/helpers/eventCategories';

const EventButtons = ({
  events,
  singleOrAvg,
  activeEvent,
  onEventSelect,
  hideCategories = false,
}: {
  events: IEvent[];
  singleOrAvg?: 'single' | 'average'; // mutually exclusive with onEventSelect
  activeEvent?: IEvent;
  onEventSelect?: (eventId: string) => void; // mutually exclusive with singleOrAvg
  hideCategories?: boolean;
}) => {
  if (!!onEventSelect === !!singleOrAvg) {
    throw new Error('Error: onEventSelect and singleOrAvg are mutually exclusive props in EventButtons');
  }

  const [selectedCat, setSelectedCat] = useState(eventCategories.find((el) => activeEvent.groups.includes(el.group)));

  // If hideCategories = true, just show all events that were passed in
  const filteredEvents = useMemo(
    () => (hideCategories ? events : events.filter((el) => el.groups.includes(selectedCat.group))),
    [events, hideCategories, selectedCat],
  );

  const handleEventClick = (eventId: string) => {
    if (onEventSelect) onEventSelect(eventId);
    else window.location.href = `/rankings/${eventId}/${singleOrAvg}`;
  };

  return (
    <div>
      {!hideCategories && (
        <div className="btn-group btn-group-sm my-2" role="group" aria-label="Type">
          {eventCategories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={'btn btn-primary' + (cat === selectedCat ? ' active' : '')}
              onClick={() => setSelectedCat(cat)}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      <div className="d-flex flex-wrap mb-3 fs-3">
        {filteredEvents.map(({ eventId, name, groups }) => {
          const isOrWasWCAEvent = groups.includes(EventGroup.WCA) || groups.includes(EventGroup.RemovedWCA);
          const isActive = activeEvent.eventId === eventId;

          if (isOrWasWCAEvent || eventId === 'fto') {
            return (
              <div
                key={eventId}
                className={'cc-icon-button' + (isActive ? ' cc-icon-button_active' : '')}
                onClick={() => handleEventClick(eventId)}
              >
                <span className={`cubing-icon ${isOrWasWCAEvent ? 'event' : 'unofficial'}-${eventId}`}></span>
              </div>
            );
          }

          return (
            <button
              key={eventId}
              type="button"
              className={'btn btn-light btn-sm m-1' + (isActive ? ' active' : '')}
              onClick={() => handleEventClick(eventId)}
            >
              {name.replace('3x3x3', '3x3').replace('Blindfolded', 'BLD')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EventButtons;
