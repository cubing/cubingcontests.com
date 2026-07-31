import "server-only";
import { and, desc, eq, exists, inArray } from "drizzle-orm";
import { type DbTransactionType, db } from "~/server/db/provider.ts";
import { type SelectContest, contestsTable as table } from "~/server/db/schema/contests.ts";
import { type EventResponseWithCategory, eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import { type MatchResponse, matchesPublicCols, matchesTable } from "~/server/db/schema/matches.ts";
import { type PersonResponse, personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import { type RegionResponse, regionsTable } from "~/server/db/schema/regions.ts";
import { type ResultResponse, resultsPublicCols, resultsTable } from "~/server/db/schema/results.ts";
import { type RoundResponse, roundsPublicCols, roundsTable } from "~/server/db/schema/rounds.ts";
import { type SetResponse, setsPublicCols, setsTable } from "~/server/db/schema/sets.ts";
import { getEvents, getRecordConfigs, getRegions } from "~/server/server-only-functions/server-only-functions.ts";

export async function getContests({
  organizationId,
  eventId,
  region,
}: {
  organizationId: string;
  eventId?: string;
  region?: RegionResponse;
}) {
  return await db
    .select({
      competitionId: table.competitionId,
      shortName: table.shortName,
      type: table.type,
      city: table.city,
      regionCode: table.regionCode,
      startDate: table.startDate,
      endDate: table.endDate,
      participants: table.participants,
    })
    .from(table)
    .leftJoin(
      regionsTable,
      and(eq(table.organizationId, regionsTable.organizationId), eq(table.regionCode, regionsTable.code)),
    )
    .where(
      and(
        eq(table.organizationId, organizationId),
        inArray(table.state, ["approved", "ongoing", "finished", "published"]),
        // Filter by continent or by country
        region
          ? eq(region.type === "super-region" ? regionsTable.superRegionCode : table.regionCode, region.code)
          : undefined,
        eventId
          ? exists(
              db
                .select()
                .from(roundsTable)
                .where(
                  and(
                    eq(roundsTable.organizationId, table.organizationId),
                    eq(roundsTable.competitionId, table.competitionId),
                    eq(roundsTable.eventId, eventId),
                  ),
                ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(table.startDate));
}

export async function getContest({
  organizationId,
  competitionId,
  eventId,
}: {
  organizationId: string;
  competitionId: string;
  eventId?: string;
}): Promise<{
  contest: Pick<
    SelectContest,
    "competitionId" | "state" | "name" | "shortName" | "type" | "startDate" | "organizerIds" | "schedule"
  >;
  events: EventResponseWithCategory[];
  rounds: RoundResponse[];
  results?: ResultResponse[];
  matches?: MatchResponse[];
  sets?: SetResponse[];
  persons: PersonResponse[];
  recordConfigs: RecordConfigResponse[];
  regions: RegionResponse[];
} | null> {
  const [contest, rounds] = await Promise.all([
    db.query.contests.findFirst({
      columns: {
        competitionId: true,
        state: true,
        name: true,
        shortName: true,
        type: true,
        startDate: true,
        organizerIds: true,
        schedule: true,
      },
      where: { organizationId, competitionId },
    }),
    // Rounds are further filtered below, once it's known what event is needed
    db
      .select(roundsPublicCols)
      .from(roundsTable)
      .where(and(eq(roundsTable.organizationId, organizationId), eq(roundsTable.competitionId, competitionId)))
      .orderBy(roundsTable.roundNumber),
  ]);
  if (!contest) return null;

  const eventIds = Array.from(new Set(rounds.map((r) => r.eventId)));

  const [events, recordConfigs, regions] = await Promise.all([
    getEvents({ organizationId, eventIds }),
    getRecordConfigs(organizationId, { contestType: contest.type }),
    getRegions(organizationId),
  ]);
  if (eventId && !events.some((e) => e.eventId === eventId)) throw new Error(`Event with ID ${eventId} not found`);

  const event = events.find((e) => e.eventId === (eventId ?? events[0].eventId))!;

  const [results, matches, sets] = await Promise.all([
    event.format === "h2h"
      ? undefined
      : await getContestEventResults({ organizationId, competitionId, eventId: event.eventId }),
    event.format === "h2h"
      ? await db
          .select(matchesPublicCols)
          .from(matchesTable)
          .where(
            and(
              eq(matchesTable.organizationId, organizationId),
              eq(matchesTable.competitionId, competitionId),
              eq(matchesTable.eventId, event.eventId),
            ),
          )
      : undefined,
    event.format === "h2h"
      ? await db
          .select(setsPublicCols)
          .from(setsTable)
          .where(
            and(
              eq(setsTable.organizationId, organizationId),
              eq(setsTable.competitionId, competitionId),
              eq(setsTable.eventId, event.eventId),
            ),
          )
      : undefined,
  ]);

  const personIds: number[] = [];
  if (results) {
    for (const result of results) personIds.push(...result.personIds);
  }
  if (matches) {
    for (const match of matches) personIds.push(...match.team1.participantIds, ...match.team2.participantIds);
  }

  const persons = await db
    .select(personsPublicCols)
    .from(personsTable)
    .where(inArray(personsTable.id, Array.from(new Set(personIds))));

  return {
    contest,
    events,
    rounds: rounds.filter((r) => r.eventId === event.eventId),
    results,
    matches,
    sets,
    persons,
    recordConfigs,
    regions,
  };
}

export async function getContestEventResults({
  organizationId,
  competitionId,
  eventId,
}: {
  organizationId: string;
  competitionId: string;
  eventId: string;
}) {
  return await db
    .select(resultsPublicCols)
    .from(resultsTable)
    .where(
      and(
        eq(resultsTable.organizationId, organizationId),
        eq(resultsTable.competitionId, competitionId),
        eq(resultsTable.eventId, eventId),
      ),
    )
    .orderBy(resultsTable.roundId, resultsTable.ranking);
}

export async function getContestParticipantIds({
  tx: db,
  organizationId,
  competitionId,
}: {
  tx: DbTransactionType;
  organizationId: string;
  competitionId: string;
}): Promise<number[]> {
  const results = await db.query.results.findMany({
    columns: { personIds: true },
    where: { organizationId, competitionId },
  });

  const participantIds = new Set<number>();
  for (const result of results) {
    for (const personId of result.personIds) {
      participantIds.add(personId);
    }
  }

  return Array.from(participantIds);
}
