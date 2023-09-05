'use client';

import '@cubing/icons';
import { useMemo, useState } from 'react';
import { IEvent } from '@sh/interfaces';
import { EventGroup } from '@sh/enums';
import { eventCategories } from '~/helpers/eventCategories';

const EventButtons = ({
  events,
  activeEvent,
  singleOrAvg,
}: {
  events: IEvent[];
  activeEvent?: IEvent;
  singleOrAvg: 'single' | 'average';
}) => {
  const [selectedCat, setSelectedCat] = useState(eventCategories.find((el) => activeEvent.groups.includes(el.group)));

  const filteredEvents = useMemo(
    () => events.filter((el) => el.groups.includes(selectedCat.group)),
    [events, selectedCat],
  );

  const handleEventClick = (eventId: string) => {
    window.location.href = `/rankings/${eventId}/${singleOrAvg}`;
  };

  return (
    <div>
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
