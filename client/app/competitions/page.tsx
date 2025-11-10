import { ssrFetch } from "~/helpers/fetchUtils.ts";
import ContestsTable from "~/app/components/ContestsTable.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import { C } from "~/helpers/constants";
import AffiliateLink from "../components/AffiliateLink";

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

type Props = {
  searchParams: Promise<{ eventId?: string }>;
};

const ContestsPage = async ({ searchParams }: Props) => {
  const { eventId } = await searchParams;
  const eventsResponse = await ssrFetch("/events");
  const contestsResponse = await ssrFetch(`/competitions${eventId ? `?eventId=${eventId}` : ""}`, {
    revalidate: C.contestsRev,
  });

  return (
    <div>
      <h2 className="mb-4 text-center">All contests</h2>

      <AffiliateLink type="other" />

      {!eventsResponse.success || !contestsResponse.success
        ? <h3 className="mt-4 text-center">Error while loading contests</h3>
        : (
          <>
            <div className="px-2">
              <EventButtons key={eventId} eventId={eventId} events={eventsResponse.data} forPage="competitions" />
            </div>

            {contestsResponse.data.length > 0
              ? <ContestsTable contests={contestsResponse.data} />
              : <p className="mx-3 fs-5">No contests have been held yet</p>}
          </>
        )}
    </div>
  );
};

export default ContestsPage;
