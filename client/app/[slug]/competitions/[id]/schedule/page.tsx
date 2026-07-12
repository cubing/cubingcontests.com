import { and, eq, inArray } from "drizzle-orm";
import ContestLayout from "~/app/[slug]/competitions/[id]/ContestLayout.tsx";
import Schedule from "~/app/components/Schedule.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import { getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

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
    <ContestLayout organizationSlug={slug} contest={contest} activeTab="schedule">
      <Schedule
        organizationSlug={slug}
        rooms={contest.schedule.venues[0].rooms}
        events={events}
        rounds={rounds}
        timezone={contest.schedule.venues[0].timezone}
      />
    </ContestLayout>
  );
}

export default CompetitionSchedulePage;
