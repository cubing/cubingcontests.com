import { inArray } from "drizzle-orm";
import ContestLayout from "~/app/competitions/[id]/ContestLayout.tsx";
import Schedule from "~/app/components/Schedule.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";

type Props = {
  params: Promise<{ id: string }>;
};

async function CompetitionSchedulePage({ params }: Props) {
  const { id } = await params;

  const contestPromise = db.query.contests.findFirst({
    columns: { competitionId: true, name: true, type: true, schedule: true },
    where: { competitionId: id },
  });
  const roundsPromise = db.query.rounds.findMany({
    columns: { eventId: true, roundNumber: true, roundTypeId: true, format: true },
    where: { competitionId: id },
  });
  const [contest, rounds] = await Promise.all([contestPromise, roundsPromise]);

  const eventIds = Array.from(new Set(rounds.map((r) => r.eventId)));
  const events = await db.select(eventsPublicCols).from(eventsTable).where(inArray(eventsTable.eventId, eventIds));

  if (!contest?.schedule || !rounds || !events) return <LoadingError loadingEntity="contest" />;

  return (
    <ContestLayout contest={contest} activeTab="schedule">
      <Schedule
        rooms={contest.schedule.venues[0].rooms}
        events={events}
        rounds={rounds}
        timeZone={contest.schedule.venues[0].timezone}
      />
    </ContestLayout>
  );
}

export default CompetitionSchedulePage;
