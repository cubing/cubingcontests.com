import { ssrFetch } from "~/helpers/fetchUtils.ts";
import ContestsTable from "~/app/components/ContestsTable.tsx";
import EventButtons from "../components/EventButtons.tsx";

// SEO
export const metadata = {
  title: "All contests | Cubing Contests",
  description: "List of unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: "/favicon.png" },
  metadataBase: new URL("https://cubingcontests.com"),
  openGraph: {
    images: ["/api2/static/cubing_contests_2.jpg"],
  },
};

const ContestsPage = async (
  { searchParams: { eventId } }: { searchParams: { eventId?: string } },
) => {
  const { payload: events } = await ssrFetch("/events");
  const { payload: contests } = await ssrFetch(`/competitions${eventId ? `?eventId=${eventId}` : ""}`);

  return (
    <div>
      <h2 className="mb-4 text-center">All contests</h2>

      <div className="px-2">
        {events && (
          <EventButtons
            key={eventId}
            eventId={eventId}
            events={events}
            forPage="competitions"
          />
        )}
      </div>

      {contests?.length > 0
        ? <ContestsTable contests={contests} />
        : <p className="mx-2 fs-5">No contests have been held yet</p>}
    </div>
  );
};

export default ContestsPage;
