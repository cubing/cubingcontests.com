import { and, desc, eq, exists, inArray } from "drizzle-orm";
import { Suspense } from "react";
import ContestsTable from "~/app/components/ContestsTable.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import RegionSelect from "~/app/components/RegionSelect.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import { contestsTable } from "~/server/db/schema/contests.ts";
import { regionsTable } from "~/server/db/schema/regions.ts";
import { roundsTable } from "~/server/db/schema/rounds.ts";
import { getEvents, getOrgDetails, getRegions } from "~/server/server-only-functions.ts";

export const metadata = {
  title: "Contests",
  description: process.env.METADATA_CONTESTS_DESCRIPTION,
  openGraph: {
    images: [`${process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BUCKET_BASE_URL}/assets/screenshots/contests.jpg`],
  },
};

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    eventId?: string;
    region?: string;
  }>;
};

async function ContestsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { eventId, region: regionCode } = await searchParams;

  const organization = await getOrgDetails({ slug });
  const [events, regions] = await Promise.all([
    getEvents({ organizationId: organization!.id }),
    getRegions(organization!.id),
  ]);

  const region = regionCode ? regions.find((r) => r.code === regionCode) : undefined;
  if (regionCode && !region) return <LoadingError loadingEntity="contests" />;

  const contestsPromise = db
    .select({
      competitionId: contestsTable.competitionId,
      shortName: contestsTable.shortName,
      type: contestsTable.type,
      city: contestsTable.city,
      regionCode: contestsTable.regionCode,
      startDate: contestsTable.startDate,
      endDate: contestsTable.endDate,
      participants: contestsTable.participants,
    })
    .from(contestsTable)
    .leftJoin(
      regionsTable,
      and(
        eq(contestsTable.organizationId, regionsTable.organizationId),
        eq(contestsTable.regionCode, regionsTable.code),
      ),
    )
    .where(
      and(
        eq(contestsTable.organizationId, organization.id),
        inArray(contestsTable.state, ["approved", "ongoing", "finished", "published"]),
        // Filter by continent or by country
        region
          ? eq(region.type === "super-region" ? regionsTable.superRegionCode : contestsTable.regionCode, region.code)
          : undefined,
        eventId
          ? exists(
              db
                .select()
                .from(roundsTable)
                .where(
                  and(
                    eq(roundsTable.organizationId, contestsTable.organizationId),
                    eq(roundsTable.competitionId, contestsTable.competitionId),
                    eq(roundsTable.eventId, eventId),
                  ),
                ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(contestsTable.startDate));

  return (
    <section>
      <h2 className="mb-4 text-center">All Contests</h2>

      {events.length === 0 ? (
        <LoadingError loadingEntity="contests" reason="events not found" />
      ) : (
        <>
          <div className="mb-3 px-2">
            <EventButtons events={events} resetOnSameEventClick />
            <div style={{ maxWidth: "24rem" }}>
              <RegionSelect regions={regions} />
            </div>
          </div>

          <Suspense fallback={<Loading />}>
            <ContestsTable contestsPromise={contestsPromise} regions={regions} />
          </Suspense>
        </>
      )}
    </section>
  );
}

export default ContestsPage;
