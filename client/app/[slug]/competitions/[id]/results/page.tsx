import type { Metadata } from "next";
import ContestLayout from "~/app/[slug]/competitions/[id]/ContestLayout.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import EventResultsTable from "~/app/components/EventResultsTable.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import { getContest } from "~/server/server-only-functions/contests-functions.ts";
import { getEventCategories, getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
  searchParams: Promise<{
    eventId?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;

  const contest = await db.query.contests.findFirst({
    columns: { shortName: true },
    where: { organization: { slug }, competitionId: id },
  });

  return {
    title: `${contest?.shortName} Results`,
    openGraph: process.env.OG_IMAGES_URL
      ? { images: [`${process.env.OG_IMAGES_URL}/${slug}/competitions/${id}/results`] }
      : undefined,
  };
}

async function ContestResultsPage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { eventId } = await searchParams;

  const organization = await getOrgDetails({ slug });
  const [contestData, eventCategories] = await Promise.all([
    getContest({ organizationId: organization.id, competitionId: id, eventId }),
    getEventCategories({ organizationId: organization.id }),
  ]);
  if (!contestData) return <LoadingError loadingEntity="contest results" />;

  const { contest, events, rounds, results, persons, recordConfigs, regions } = contestData;
  const event = eventId ? events.find((e) => e.eventId === eventId)! : events[0];

  return (
    <ContestLayout organizationSlug={slug} contest={contest} activeTab="results">
      <div className="px-1">
        <EventButtons events={events} eventCategories={eventCategories} eventIdOverride={event.eventId} showAllEvents />
      </div>
      <EventResultsTable
        event={event}
        rounds={rounds}
        results={results}
        persons={persons}
        recordConfigs={recordConfigs}
        regions={regions}
      />
    </ContestLayout>
  );
}

export default ContestResultsPage;
