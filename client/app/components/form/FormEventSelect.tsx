'use client';

import { IEvent } from '@sh/types';

const FormEventSelect = ({
  title = 'Event',
  noMargin = false,
  events,
  eventId,
  setEventId,
  disabled = false,
}: {
  title?: string;
  noMargin?: boolean;
  events: IEvent[];
  eventId: string;
  setEventId: (val: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div className={'fs-5' + (noMargin ? '' : ' mb-3')}>
      {title && (
        <label htmlFor="event_select" className="form-label">
          {title}
        </label>
      )}
      <select
        id="event_select"
        className="form-select"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        disabled={disabled || !events.some((e) => e.eventId === eventId)}
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
