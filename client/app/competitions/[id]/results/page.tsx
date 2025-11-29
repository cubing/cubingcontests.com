import { and, eq, inArray } from "drizzle-orm";
import ContestLayout from "~/app/competitions/[id]/ContestLayout.tsx";
import ContestResults from "~/app/components/ContestResults.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import { personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { resultsPublicCols, resultsTable } from "~/server/db/schema/results.ts";
import { roundsPublicCols, roundsTable } from "~/server/db/schema/rounds.ts";
import { getRecordConfigs } from "~/server/serverUtilityFunctions.ts";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
};

async function ContestResultsPage({ params, searchParams }: Props) {
  const { id } = await params;
  let { eventId } = await searchParams;

  const contestPromise = db.query.contests.findFirst({
    columns: { competitionId: true, name: true, type: true, schedule: true },
    where: { competitionId: id },
  });
  const roundsPromise = db.select(roundsPublicCols).from(roundsTable).where(eq(roundsTable.competitionId, id));
  const [contest, rounds] = await Promise.all([contestPromise, roundsPromise]);

  if (!contest || !rounds) return <LoadingError loadingEntity="contest results" />;

  const eventIds = Array.from(new Set(rounds.map((r) => r.eventId)));
  const eventsPromise = db
    .select(eventsPublicCols)
    .from(eventsTable)
    .where(inArray(eventsTable.eventId, eventIds))
    .orderBy(eventsTable.rank);
  const recordConfigsPromise = getRecordConfigs(contest.type === "meetup" ? "meetups" : "competitions");
  const [events, recordConfigs] = await Promise.all([eventsPromise, recordConfigsPromise]);

  if (!events || !recordConfigs) return <LoadingError loadingEntity="contest results" />;
  if (!eventId) eventId = events[0].eventId;

  const results = await db
    .select(resultsPublicCols)
    .from(resultsTable)
    .where(and(eq(resultsTable.competitionId, id), eq(resultsTable.eventId, eventId)));
  const personIds = Array.from(new Set(results.map((r) => r.personIds).reduce((prev, curr) => [...prev, ...curr], [])));
  const persons = await db
    .select(personsPublicCols)
    .from(personsTable)
    .where(inArray(personsTable.personId, personIds));

  return (
    <ContestLayout contest={contest} activeTab="results">
      <ContestResults
        eventId={eventId}
        events={events}
        rounds={rounds.filter((r) => r.eventId === eventId)}
        results={results}
        persons={persons}
        recordConfigs={recordConfigs}
      />
    </ContestLayout>
  );
}

export default ContestResultsPage;
