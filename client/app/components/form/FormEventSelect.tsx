'use client';

import { IEvent } from '@sh/interfaces';

const FormEventSelect = ({
  label = 'Event',
  noMargin = false,
  events,
  eventId,
  setEventId,
  disabled = false,
}: {
  label?: string;
  noMargin?: boolean;
  events: IEvent[];
  eventId: string;
  setEventId: (val: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div className={'fs-5' + (noMargin ? '' : ' mb-3')}>
      {label && (
        <label htmlFor="event_id" className="form-label">
          {label}
        </label>
      )}
      <select
        id="event_id"
        className="form-select"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        disabled={events.length === 0 || disabled}
      >
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
