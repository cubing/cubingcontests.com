'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IEvent } from '@sh/types';
import { eventCategories } from '~/helpers/eventCategories';
import EventIcon from '@c/EventIcon';

const EventButtons = ({
  events,
  singleOrAvg,
  activeEvent,
  onEventSelect,
  showCategories = false,
}: {
  events: IEvent[];
  singleOrAvg?: 'single' | 'average'; // mutually exclusive with onEventSelect
  activeEvent?: IEvent;
  onEventSelect?: (eventId: string) => void; // mutually exclusive with singleOrAvg
  showCategories?: boolean;
}) => {
  if (!!onEventSelect === !!singleOrAvg) {
    throw new Error('Error: onEventSelect and singleOrAvg are mutually exclusive props in EventButtons');
  }

  const [selectedCat, setSelectedCat] = useState(eventCategories.find((el) => activeEvent.groups.includes(el.group)));

  const searchParams = useSearchParams();

  // If hideCategories = true, just show all events that were passed in
  const filteredEvents = useMemo(
    () => (!showCategories ? events : events.filter((el) => el.groups.includes(selectedCat.group))),
    [events, selectedCat],
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
      {showCategories && (
        <>
          <div className="btn-group btn-group-sm mt-2 mb-3" role="group">
            {eventCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={'btn btn-primary' + (cat === selectedCat ? ' active' : '')}
                onClick={() => setSelectedCat(cat)}
              >
                <span className="d-none d-md-inline">{cat.title}</span>
                <span className="d-inline d-md-none">{cat.shortTitle || cat.title}</span>
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
            onClick={() => handleEventClick(event.eventId)}
            isActive={activeEvent.eventId === event.eventId}
          />
        ))}
      </div>
    </div>
  );
};

export default EventButtons;
