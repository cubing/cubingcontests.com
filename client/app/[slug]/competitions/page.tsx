import type { Metadata } from "next";
import { Suspense } from "react";
import ContestsTable from "~/app/components/ContestsTable.tsx";
import DonateButton from "~/app/components/content/DonateButton.tsx";
import DonationGoals from "~/app/components/content/DonationGoals.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import RegionSelect from "~/app/components/RegionSelect.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { getContests } from "~/server/server-only-functions/contests-functions.ts";
import {
  getEventCategories,
  getEvents,
  getOrgDetails,
  getRegions,
  getSettingFromDb,
} from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    eventId?: string;
    region?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: "Competitions",
    description: process.env.METADATA_CONTESTS_DESCRIPTION,
    openGraph: process.env.OG_IMAGES_URL
      ? { images: [`${process.env.OG_IMAGES_URL}/${slug}/competitions`] }
      : undefined,
  };
}

async function ContestsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { eventId, region: regionCode } = await searchParams;

  const organization = await getOrgDetails({ slug });
  const [events, eventCategories, regions, kofiGoalProgress] = await Promise.all([
    getEvents({ organizationId: organization.id }),
    getEventCategories({ organizationId: organization.id }),
    getRegions(organization.id),
    getSettingFromDb({ key: "kofi-goal-progress", organizationId: null, optional: true }),
  ]);

  const region = regionCode ? regions.find((r) => r.code === regionCode) : undefined;
  if (regionCode && !region) return <LoadingError loadingEntity="competitions" />;

  const contestsPromise = getContests({ organizationId: organization.id, eventId, region });

  return (
    <section>
      <h2 className="mb-4 text-center">All Competitions</h2>

      {events.length === 0 ? (
        <LoadingError loadingEntity="competitions" reason="events not found" />
      ) : (
        <>
          <div className="mb-3 px-2">
            {organization.metadata.showDonationLinks && kofiGoalProgress !== null && (
              <>
                <DonationGoals kofiGoalProgress={kofiGoalProgress} compact />
                <div className="my-3">
                  <DonateButton />
                </div>
              </>
            )}

            <EventButtons events={events} eventCategories={eventCategories} resetOnSameEventClick />
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
