'use client';

import { IEvent } from '@sh/interfaces';

const FormEventSelect = ({
  label = 'Event',
  events,
  eventId,
  setEventId,
}: {
  label?: string;
  events: IEvent[];
  eventId: string;
  setEventId: (val: string) => void;
}) => {
  return (
    <div className="mb-3 fs-5">
      {label && (
        <label htmlFor="event_id" className="form-label">
          {label}
        </label>
      )}
      <select id="event_id" className="form-select" value={eventId} onChange={(e) => setEventId(e.target.value)}>
        {events.map((el: IEvent) => (
          <option key={el.eventId} value={el.eventId}>
            {el.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormEventSelect;
