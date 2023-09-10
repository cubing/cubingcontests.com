'use client';

import '@cubing/icons';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IEvent } from '@sh/interfaces';
import { EventGroup } from '@sh/enums';
import { eventCategories } from '~/helpers/eventCategories';
import EventIcon from './EventIcon';

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

  const searchParams = useSearchParams();

  // If hideCategories = true, just show all events that were passed in
  const filteredEvents = useMemo(
    () => (hideCategories ? events : events.filter((el) => el.groups.includes(selectedCat.group))),
    [events, hideCategories, selectedCat],
  );

  const handleEventClick = (eventId: string) => {
    if (onEventSelect) {
      onEventSelect(eventId);
    } else {
      const show = searchParams.get('show');
      window.location.href = `/rankings/${eventId}/${singleOrAvg}${show ? `?show=${show}` : ''}`;
    }
  };

  return (
    <div>
      {!hideCategories && (
        <>
          <div className="btn-group btn-group-sm mt-2 mb-3" role="group" aria-label="Type">
            {eventCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={'btn btn-primary' + (cat === selectedCat ? ' active' : '')}
                onClick={() => setSelectedCat(cat)}
              >
                <span className="d-inline d-lg-none">{cat.mobileTitle || cat.title}</span>
                <span className="d-none d-lg-inline">{cat.title}</span>
              </button>
            ))}
          </div>

          {selectedCat.description && <p>{selectedCat.description}</p>}
        </>
      )}

      <div className="d-flex flex-wrap mb-3 fs-3">
        {filteredEvents.map((event) => (
          <EventIcon
            key={event.eventId}
            event={event}
            onClick={handleEventClick}
            isActive={activeEvent.eventId === event.eventId}
          />
        ))}
      </div>
    </div>
  );
};

export default EventButtons;
