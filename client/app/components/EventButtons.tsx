'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { IEvent } from '@sh/types';
import { eventCategories } from '~/helpers/eventCategories';
import EventIcon from '@c/EventIcon';

const EventButtons = ({
  eventId,
  events,
  forPage,
}: {
  eventId: string;
  events: IEvent[];
  forPage: 'results' | 'rankings' | 'competitions' | 'data-entry';
}) => {
  const router = useRouter();
  const { id, singleOrAvg } = useParams();
  const searchParams = useSearchParams();

  const [selectedCat, setSelectedCat] = useState(
    eventCategories.find((el) => events.find((e) => e.eventId === eventId)?.groups.includes(el.group)),
  );

  // If hideCategories = true, just show all events that were passed in
  const filteredEvents = useMemo(
    () => (forPage !== 'rankings' ? events : events.filter((el) => el.groups.includes(selectedCat.group))),
    [events, selectedCat],
  );

  const handleEventClick = (eventId: string) => {
    if (forPage === 'results') {
      router.push(`/competitions/${id}/results?eventId=${eventId}`);
    } else if (forPage === 'rankings') {
      const show = searchParams.get('show');
      router.push(`/rankings/${eventId}/${singleOrAvg}${show ? `?show=${show}` : ''}`);
    } else if (forPage === 'competitions') {
      if (searchParams.get('eventId') === eventId) {
        router.push('/competitions');
      } else {
        router.push(`/competitions?eventId=${eventId}`);
      }
    } else {
      window.location.href = `/mod/competition/${id}?eventId=${eventId}`;
    }
  };

  return (
    <div>
      {/* Event categories */}
      {forPage === 'rankings' && (
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
            isActive={event.eventId === eventId}
          />
        ))}
      </div>
    </div>
  );
};

export default EventButtons;
