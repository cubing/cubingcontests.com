"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import EventIcon from "~/app/components/EventIcon.tsx";
import { eventCategories } from "~/helpers/eventCategories.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";

const filteredCategories = eventCategories.filter((ec) => ec.value !== "removed");

type Props = {
  eventId: string | undefined;
  events: EventResponse[];
  forPage: "results" | "rankings" | "competitions" | "data-entry";
};

function EventButtons({ eventId, events, forPage }: Props) {
  const router = useRouter();
  const { id, singleOrAvg } = useParams();
  const searchParams = useSearchParams();

  const [selectedCat, setSelectedCat] = useState(
    filteredCategories.find((ec) => events.find((e) => e.eventId === eventId)?.category === ec.value) ??
      filteredCategories.at(0)!,
  );

  // If hideCategories = true, just show all events that were passed in
  const filteredEvents = useMemo<EventResponse[]>(
    () =>
      !["rankings", "competitions"].includes(forPage)
        ? events
        : events.filter((e) => !e.hidden && e.category === selectedCat.value),
    [events, selectedCat, forPage],
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
      if (searchParams.get("eventId") === newEventId) router.replace("/competitions");
      else router.replace(`/competitions?eventId=${newEventId}`);
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
                className={`btn btn-primary ${cat === selectedCat ? "active" : ""}`}
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

      <div className="d-flex fs-3 mb-3 flex-wrap">
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
}

export default EventButtons;
