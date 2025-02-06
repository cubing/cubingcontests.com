"use client";

import { Event } from "~/helpers/types.ts";

type Props = {
  title?: string;
  noMargin?: boolean;
  events: Event[];
  eventId: string;
  setEventId: (val: string) => void;
  disabled?: boolean;
};

const FormEventSelect = ({
  title = "Event",
  noMargin = false,
  events,
  eventId,
  setEventId,
  disabled = false,
}: Props) => {
  return (
    <div className={"fs-5" + (noMargin ? "" : " mb-3")}>
      {title && <label htmlFor="event_select" className="form-label">{title}</label>}
      <select
        id="event_select"
        className="form-select"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        disabled={disabled || !events.some((e) => e.eventId === eventId)}
      >
        {events.map((e: Event) => <option key={e.eventId} value={e.eventId}>{e.name}</option>)}
      </select>
    </div>
  );
};

export default FormEventSelect;
