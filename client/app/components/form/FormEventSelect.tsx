'use client';

import IEvent from '@sh/interfaces/Event';

const FormEventSelect = ({
  events,
  label = 'Event',
  eventId,
  setEventId,
}: {
  events: IEvent[];
  label?: string;
  eventId: string;
  setEventId: any;
}) => {
  return (
    <div className="mb-3 fs-5">
      <label htmlFor="event_id" className="form-label">
        {label}
      </label>
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
