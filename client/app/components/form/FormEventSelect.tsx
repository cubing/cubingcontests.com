"use client";

import type { EventResponse } from "~/server/db/schema/events.ts";

type Props = {
  title?: string;
  events: EventResponse[];
  eventId: string;
  setEventId: (val: string) => void;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

function FormEventSelect({ title = "Event", events, eventId, setEventId, disabled = false, className }: Props) {
  return (
    <div className={className}>
      {title && (
        <label htmlFor="event_select" className="form-label fw-semibold">
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
        {events.map((e) => (
          <option key={e.eventId} value={e.eventId}>
            {e.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FormEventSelect;
