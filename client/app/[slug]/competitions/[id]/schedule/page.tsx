import { and, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { getContestTabs } from "~/app/[slug]/competitions/[id]/tabs.ts";
import Schedule from "~/app/components/Schedule.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { db } from "~/server/db/provider.ts";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import { getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;

  const contest = await db.query.contests.findFirst({
    columns: { shortName: true },
    where: { organization: { slug }, competitionId: id },
  });

  return {
    title: `${contest?.shortName} Schedule`,
    openGraph: process.env.OG_IMAGES_URL
      ? { images: [`${process.env.OG_IMAGES_URL}/${slug}/competitions/${id}/schedule`] }
      : undefined,
  };
}

async function CompetitionSchedulePage({ params }: Props) {
  const { slug, id } = await params;

  const organization = await getOrgDetails({ slug });
  const [contest, rounds] = await Promise.all([
    db.query.contests.findFirst({
      columns: { competitionId: true, name: true, type: true, schedule: true },
      where: { organizationId: organization.id, competitionId: id },
    }),
    db.query.rounds.findMany({
      columns: { eventId: true, roundNumber: true, roundTypeId: true, format: true },
      where: { organizationId: organization.id, competitionId: id },
    }),
  ]);

  const eventIds = Array.from(new Set(rounds.map((r) => r.eventId)));
  const events = await db
    .select(eventsPublicCols)
    .from(eventsTable)
    .where(and(eq(eventsTable.organizationId, organization.id), inArray(eventsTable.eventId, eventIds)));

  if (!contest?.schedule || !rounds || !events) return <LoadingError loadingEntity="contest" />;

  return (
    <>
      <Tabs tabs={getContestTabs(slug, contest)} activeTab="schedule" forServerSidePage replace />

      <Schedule
        organizationSlug={slug}
        rooms={contest.schedule.venues[0].rooms}
        events={events}
        rounds={rounds}
        timezone={contest.schedule.venues[0].timezone}
        contestType={contest.type}
      />
    </>
  );
}

export default CompetitionSchedulePage;
