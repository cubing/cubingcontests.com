import { and, eq, ne } from "drizzle-orm";
import ContestsTable from "~/app/components/ContestsTable.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import { Continents, Countries } from "~/helpers/Countries.ts";
import { db } from "~/server/db/provider.ts";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import AffiliateLink from "../components/AffiliateLink.tsx";
import RegionSelect from "../rankings/[eventId]/[singleOrAvg]/RegionSelect.tsx";

// SEO
export const metadata = {
  title: "All contests | Cubing Contests",
  description: "List of unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: "/favicon.png" },
  metadataBase: new URL("https://cubingcontests.com"),
  openGraph: {
    images: ["/banners/cubing_contests_2.jpg"],
  },
};

type Props = {
  searchParams: Promise<{
    eventId?: string;
    region?: string;
  }>;
};

async function ContestsPage({ searchParams }: Props) {
  const { eventId, region } = await searchParams;

  const filterByContinent = !!region && Continents.some((c) => region === c.code);
  const continentCountryCodes =
    filterByContinent && Countries.filter((c) => c.continentId === region).map((c) => c.code);
  const contests = await db.query.contests.findMany({
    columns: {
      competitionId: true,
      shortName: true,
      type: true,
      city: true,
      countryIso2: true,
      startDate: true,
      endDate: true,
      participants: true,
    },
    with: { rounds: { columns: { roundId: true } } },
    where: {
      rounds: eventId ? { roundId: { like: `${eventId}-r%` } } : undefined,
      countryIso2: continentCountryCodes ? { in: continentCountryCodes } : region ? { eq: region } : undefined,
    },
    orderBy: { startDate: "desc" },
  });
  const events = await db
    .select(eventsPublicCols)
    .from(eventsTable)
    .where(and(ne(eventsTable.category, "removed"), eq(eventsTable.hidden, false)))
    .orderBy(eventsTable.rank);

  return (
    <div>
      <h2 className="mb-4 text-center">All contests</h2>

      <AffiliateLink type="other" />

      {events.length === 0 ? (
        <h3 className="mt-4 text-center">Error while loading contests</h3>
      ) : (
        <>
          <div className="mb-3 px-2">
            <EventButtons key={eventId} eventId={eventId} events={events} forPage="competitions" />
            <div style={{ maxWidth: "24rem" }}>
              <RegionSelect />
            </div>
          </div>

          {contests.length === 0 ? (
            <p className="fs-5 mx-3">No contests have been held yet</p>
          ) : (
            <ContestsTable contests={contests} />
          )}
        </>
      )}
    </div>
  );
}

export default ContestsPage;
