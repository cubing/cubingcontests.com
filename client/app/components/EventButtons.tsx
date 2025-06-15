"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Event } from "~/helpers/types.ts";
import { eventCategories } from "~/helpers/eventCategories.ts";
import EventIcon from "~/app/components/EventIcon.tsx";

type Props = {
  eventId: string | undefined;
  events: Event[];
  forPage: "results" | "rankings" | "competitions" | "data-entry";
};

const EventButtons = ({ eventId, events, forPage }: Props) => {
  const router = useRouter();
  const { id, singleOrAvg } = useParams();
  const searchParams = useSearchParams();

  const filteredCategories = eventCategories.filter((ec) => ec.value !== "removed");

  const [selectedCat, setSelectedCat] = useState(
    filteredCategories.find((el) => events.find((e) => e.eventId === eventId)?.groups.includes(el.group)) ??
      filteredCategories[0],
  );

  // If hideCategories = true, just show all events that were passed in
  const filteredEvents = useMemo<Event[]>(
    () =>
      !["rankings", "competitions"].includes(forPage)
        ? events
        : events.filter((el) => el.groups.includes(selectedCat.group)),
    [events, selectedCat],
  );

  const handleEventClick = (newEventId: string) => {
    if (forPage === "results") {
      router.replace(`/competitions/${id}/results?eventId=${newEventId}`);
    } else if (forPage === "rankings") {
      let queryString = "";
      searchParams.forEach((value, key) => {
        queryString += `${queryString ? "&" : "?"}${key}=${value}`;
      });
      router.push(`/rankings/${newEventId}/${singleOrAvg}${queryString}`);
    } else if (forPage === "competitions") {
      if (searchParams.get("eventId") === newEventId) {
        router.replace("/competitions");
      } else {
        router.replace(`/competitions?eventId=${newEventId}`);
      }
    } else {
      router.replace(`/mod/competition/${id}?eventId=${newEventId}`);
    }
  };

  return (
    <div>
      {/* Event categories */}
      {["rankings", "competitions"].includes(forPage) && (
        <>
          <div className="btn-group btn-group-sm mt-2 mb-3" role="group">
            {filteredCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={"btn btn-primary" + (cat === selectedCat ? " active" : "")}
                onClick={() => setSelectedCat(cat)}
              >
                <span className="d-none d-md-inline">{cat.title}</span>
                <span className="d-inline d-md-none">{cat.shortTitle || cat.title}</span>
              </button>
            ))}
          </div>

          {selectedCat?.description && <p>{selectedCat.description}</p>}
        </>
      )}

      <div className="d-flex flex-wrap mb-3 fs-3">
        {filteredEvents.map((event: Event) => (
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
