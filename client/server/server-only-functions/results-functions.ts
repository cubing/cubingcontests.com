import "server-only";
import { addDays, differenceInDays, format } from "date-fns";
import { and, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import { C } from "~/helpers/constants.ts";
import { getRankedAverageFormat, roundFormats } from "~/helpers/roundFormats.ts";
import type { RecordCategory } from "~/helpers/types.ts";
import {
  compareAvgs,
  compareSingles,
  getAlwaysShowDecimals,
  getAttempt,
  getBestAndAverage,
  getFormattedResult,
  getMakesCutoff,
  getResultProceeds,
  getRoundDate,
} from "~/helpers/utility-functions.ts";
import { type DbTransactionType, db } from "~/server/db/provider.ts";
import { contestsTable, type SelectContest } from "~/server/db/schema/contests.ts";
import type { FullEvent, SelectEvent } from "~/server/db/schema/events.ts";
import type { PersonResponse, SelectPerson } from "~/server/db/schema/persons.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import {
  type Attempt,
  type InsertResult,
  type ResultResponse,
  type SelectResult,
  resultsTable as table,
} from "~/server/db/schema/results.ts";
import type { RoundResponse, SelectRound } from "~/server/db/schema/rounds.ts";
import { RrActionError } from "~/server/safe-action.ts";
import { getContestParticipantIds } from "~/server/server-only-functions/contests-functions.ts";
import { getRecordConfigs, logMessage } from "~/server/server-only-functions/server-only-functions.ts";

export async function createContestResult({
  personIds,
  attempts,
  createdBy,
  participants,
  roundResults,
  round,
  event,
  contest,
  isAdmin = false,
}: {
  personIds: number[];
  attempts: Attempt[];
  createdBy: string;
  participants: PersonResponse[];
  roundResults: SelectResult[];
  round: SelectRound;
  event: SelectEvent;
  contest: SelectContest;
  isAdmin?: boolean;
}) {
  const roundFormat = roundFormats.find((rf) => rf.value === round.format)!;
  const { best, average } = getBestAndAverage(attempts, event, roundFormat.value);
  const newResult: InsertResult = {
    organizationId: event.organizationId,
    eventId: event.eventId,
    date: getRoundDate(round, contest),
    personIds,
    attempts,
    best,
    average,
    recordCategory: contest.type === "online" ? "online" : contest.type === "meetup" ? "meetups" : "competitions",
    competitionId: contest.competitionId,
    roundId: round.id,
    ranking: 1, // gets set to the correct value below
    createdBy,
  };

  const recordConfigs = await getRecordConfigs(newResult.organizationId, { contestType: contest.type });
  await setResultRecordsAndRegions(newResult, event, recordConfigs, participants);

  if (
    !process.env.VITEST &&
    !isAdmin &&
    (newResult.regionalSingleRecord || newResult.regionalAverageRecord) &&
    differenceInDays(new Date(), newResult.date) > 30
  ) {
    throw new RrActionError(C.message.oldResultWithRecordValidationError);
  }

  await db.transaction(async (tx) => {
    const [createdResult] = await tx.insert(table).values(newResult).returning();

    await setRankingAndProceedsValues(tx, [...roundResults, createdResult], round, event.higherIsBetter);
    if (createdResult.regionalSingleRecord) {
      await cancelFutureRecords(
        tx,
        newResult.organizationId,
        createdResult,
        "best",
        recordConfigs,
        event.higherIsBetter,
      );
    }
    if (createdResult.regionalAverageRecord) {
      await cancelFutureRecords(
        tx,
        newResult.organizationId,
        createdResult,
        "average",
        recordConfigs,
        event.higherIsBetter,
      );
    }

    // Update contest state and participants
    const updateContestObject: Partial<SelectContest> = {};
    if (contest.state === "approved") updateContestObject.state = "ongoing";
    const participantIds = await getContestParticipantIds({
      tx,
      organizationId: newResult.organizationId,
      competitionId: contest.competitionId,
    });
    if (participantIds.length !== contest.participants) updateContestObject.participants = participantIds.length;
    // Do update, if some value actually changed
    if (Object.keys(updateContestObject).length > 0)
      await tx.update(contestsTable).set(updateContestObject).where(eq(contestsTable.id, contest.id));
  });
}

export async function updateContestResult({
  prevResult,
  newAttempts,
  roundResults,
  round,
  event,
  contest,
  isAdmin = false,
}: {
  prevResult: SelectResult;
  newAttempts: Attempt[];
  roundResults: SelectResult[];
  round: SelectRound;
  event: SelectEvent;
  contest: SelectContest;
  isAdmin?: boolean;
}) {
  const roundFormat = roundFormats.find((rf) => rf.value === round.format)!;
  const { best, average } = getBestAndAverage(newAttempts, event, roundFormat.value);
  const newResult: SelectResult = {
    ...prevResult,
    attempts: newAttempts,
    best,
    average,
    regionalSingleRecord: null,
    regionalAverageRecord: null,
  };
  const recordConfigs = await getRecordConfigs(newResult.organizationId, { contestType: contest.type });
  await setResultRecords(newResult, event, recordConfigs, { excludeResultId: prevResult.id });

  if (
    !process.env.VITEST &&
    !isAdmin &&
    (prevResult.regionalSingleRecord ||
      prevResult.regionalAverageRecord ||
      newResult.regionalSingleRecord ||
      newResult.regionalAverageRecord) &&
    differenceInDays(new Date(), prevResult.date) > 30
  ) {
    throw new RrActionError(C.message.oldResultWithRecordValidationError);
  }

  await db.transaction(async (tx) => {
    const [updatedResult] = await tx
      .update(table)
      .set({
        attempts: newResult.attempts,
        best: newResult.best,
        average: newResult.average,
        regionalSingleRecord: newResult.regionalSingleRecord,
        regionalAverageRecord: newResult.regionalAverageRecord,
      })
      .where(eq(table.id, prevResult.id))
      .returning();

    await setRankingAndProceedsValues(
      tx,
      roundResults.map((r) => (r.id === prevResult.id ? updatedResult : r)),
      round,
      event.higherIsBetter,
    );

    // Cancel future records, if the result got BETTER
    if (
      updatedResult.regionalSingleRecord &&
      (event.higherIsBetter ? updatedResult.best > prevResult.best : updatedResult.best < prevResult.best)
    ) {
      await cancelFutureRecords(
        tx,
        newResult.organizationId,
        updatedResult,
        "best",
        recordConfigs,
        event.higherIsBetter,
      );
    }
    if (
      updatedResult.regionalAverageRecord &&
      (event.higherIsBetter ? updatedResult.average > prevResult.average : updatedResult.average < prevResult.average)
    ) {
      await cancelFutureRecords(
        tx,
        newResult.organizationId,
        updatedResult,
        "average",
        recordConfigs,
        event.higherIsBetter,
      );
    }

    // Set records that may have been prevented before, if the result got WORSE
    if (
      prevResult.regionalSingleRecord &&
      (event.higherIsBetter ? updatedResult.best < prevResult.best : updatedResult.best > prevResult.best)
    ) {
      await setFutureRecords(tx, prevResult, event, "best", recordConfigs);
    }
    if (
      prevResult.regionalAverageRecord &&
      (event.higherIsBetter ? updatedResult.average < prevResult.average : updatedResult.average > prevResult.average)
    ) {
      await setFutureRecords(tx, prevResult, event, "average", recordConfigs);
    }
  });
}

export async function getRecordResult(
  event: Pick<SelectEvent, "organizationId" | "eventId" | "defaultRoundFormat">,
  bestOrAverage: "best" | "average",
  recordType: string,
  recordCategory: RecordCategory,
  {
    tx,
    recordsUpTo,
    excludeResultId,
    regionCode,
  }: {
    tx?: DbTransactionType; // this can optionally be run inside of a transaction
    recordsUpTo: Date;
    excludeResultId?: number;
    regionCode?: string; // only set when recordType = "NR"
  },
): Promise<SelectResult | undefined> {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const isCrRecordType = !["WR", "NR"].includes(recordType as any);
  const baseConditions = [
    eq(table.organizationId, event.organizationId),
    eq(table.eventId, event.eventId),
    eq(table.recordCategory, recordCategory),
    gt(table[bestOrAverage], 0),
    isCrRecordType
      ? eq(
          table.superRegionCode,
          (await (tx ?? db).query.regions.findFirst({
            where: { organizationId: event.organizationId, type: "super-region", superRegionRecordType: recordType },
          }))!.code,
        )
      : undefined,
    regionCode ? eq(table.regionCode, regionCode) : undefined,
  ];

  // This is necessary to account for excludeResultId, since that could be the record that is being updated,
  // and there could be another result on the same day that is the new record, but the record field hasn't been set yet.
  const [sameDayBestResult] = await (tx ?? db)
    .select()
    .from(table)
    .where(
      and(
        ...baseConditions,
        excludeResultId ? ne(table.id, excludeResultId) : undefined,
        eq(table.date, recordsUpTo),
        bestOrAverage === "average"
          ? sql`CARDINALITY(${table.attempts}) = ${getRankedAverageFormat(event.defaultRoundFormat).attempts}`
          : undefined,
      ),
    )
    .orderBy(table[bestOrAverage])
    .limit(1);

  // Similar to the code in getRecords()
  const recordTypes = ["WR"];
  if (recordType === "NR") {
    const reg = await (tx ?? db).query.regions.findFirst({
      columns: { superRegionRecordType: true },
      where: { organizationId: event.organizationId, code: regionCode, type: { in: ["country", "region"] } },
    });
    if (!reg?.superRegionRecordType) throw new RrActionError("Region not found");
    recordTypes.push(reg.superRegionRecordType, recordType);
  } else if (isCrRecordType) {
    recordTypes.push(recordType);
  }

  const [previousRecordResult] = await (tx ?? db)
    .select()
    .from(table)
    .where(and(...baseConditions, lt(table.date, recordsUpTo), inArray(table[recordField], recordTypes)))
    .orderBy(desc(table.date))
    .limit(1);

  if (previousRecordResult) {
    // If the best result of the day is better than the previous record, return that
    if (sameDayBestResult && sameDayBestResult[bestOrAverage] < previousRecordResult[bestOrAverage])
      return sameDayBestResult;
    return previousRecordResult;
  }

  return sameDayBestResult;
}

export async function setResultRecordsAndRegions(
  result: InsertResult,
  event: Pick<SelectEvent, "organizationId" | "eventId" | "defaultRoundFormat" | "higherIsBetter">,
  recordConfigs: RecordConfigResponse[], // must be of the same category
  participants: Pick<SelectPerson, "regionCode">[],
) {
  const regions = await db.query.regions.findMany({
    where: { organizationId: event.organizationId, code: { in: participants.map((p) => p.regionCode) } },
  });
  if (regions.length === 0) throw new RrActionError("Participants' regions not found");

  const isSameRegionParticipants = new Set(regions.map((r) => r.code)).size === 1;
  const isSameSuperRegionParticipants =
    isSameRegionParticipants || new Set(regions.map((r) => r.superRegionCode)).size === 1;

  if (isSameRegionParticipants) result.regionCode = regions[0].code;
  if (isSameSuperRegionParticipants) result.superRegionCode = regions[0].superRegionCode;

  await setResultRecords(result, event, recordConfigs);
}

export async function setResultRecords(
  result: InsertResult,
  event: Pick<SelectEvent, "organizationId" | "eventId" | "defaultRoundFormat" | "higherIsBetter">,
  recordConfigs: RecordConfigResponse[], // must be of the same category
  { excludeResultId }: { excludeResultId?: number } = {},
) {
  if (result.best > 0) await setResultRecord(result, event, "best", recordConfigs, { excludeResultId });
  if (result.average > 0 && result.attempts.length === getRankedAverageFormat(event.defaultRoundFormat).attempts)
    await setResultRecord(result, event, "average", recordConfigs, { excludeResultId });
}

// Updates the specified record field directly in the result object
export async function setResultRecord(
  result: InsertResult,
  event: Pick<SelectEvent, "organizationId" | "eventId" | "defaultRoundFormat" | "higherIsBetter">,
  bestOrAverage: "best" | "average",
  recordConfigs: RecordConfigResponse[], // must be of the same category
  { excludeResultId }: { excludeResultId?: number } = {},
) {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const type = bestOrAverage === "best" ? "single" : "average";
  const { category } = recordConfigs[0];
  const compareFunc = (a: any, b: any) =>
    bestOrAverage === "best"
      ? compareSingles(a, b, { higherIsBetter: event.higherIsBetter })
      : compareAvgs(a, b, { higherIsBetter: event.higherIsBetter });

  // Set WR
  const wrResult = await getRecordResult(event, bestOrAverage, "WR", category, {
    excludeResultId,
    recordsUpTo: result.date,
  });
  const isWr = !wrResult || compareFunc(result, wrResult) <= 0;

  if (isWr) {
    const wrRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === "WR")!;
    logMessage("RR0024", `New ${result.eventId} ${type} ${wrRecordConfig.label}: ${result[bestOrAverage]}`);
    result[recordField] = "WR";
  } else if (
    result.superRegionCode &&
    (result.superRegionCode !== wrResult?.superRegionCode ||
      (result.regionCode && result.regionCode !== wrResult?.regionCode))
  ) {
    // Set CR
    const crType = (await db.query.regions.findFirst({
      where: { organizationId: event.organizationId, type: "super-region", code: result.superRegionCode },
    }))!.superRegionRecordType!;
    const crResult = await getRecordResult(event, bestOrAverage, crType, category, {
      excludeResultId,
      recordsUpTo: result.date,
    });
    const isCr = !crResult || compareFunc(result, crResult) <= 0;

    if (isCr) {
      const crRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === crType)!;
      logMessage("RR0024", `New ${result.eventId} ${type} ${crRecordConfig.label}: ${result[bestOrAverage]}`);
      result[recordField] = crType;
    } else if (result.regionCode && result.regionCode !== crResult?.regionCode) {
      // Set NR
      const nrResult = await getRecordResult(event, bestOrAverage, "NR", category, {
        excludeResultId,
        recordsUpTo: result.date,
        regionCode: result.regionCode,
      });
      const isNr = !nrResult || compareFunc(result, nrResult) <= 0;

      if (isNr) {
        const nrRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === "NR")!;
        logMessage("RR0024", `New ${result.eventId} ${type} ${nrRecordConfig.label}: ${result[bestOrAverage]}`);
        result[recordField] = "NR";
      }
    }
  }
}

export async function setFutureRecords(
  db: DbTransactionType, // the tx object from a Drizzle transaction
  deletedResult: Pick<
    SelectResult,
    | "eventId"
    | "date"
    | "regionCode"
    | "superRegionCode"
    | "best"
    | "average"
    | "regionalSingleRecord"
    | "regionalAverageRecord"
  >,
  event: Pick<SelectEvent, "organizationId" | "eventId" | "defaultRoundFormat" | "higherIsBetter">,
  bestOrAverage: "best" | "average",
  recordConfigs: RecordConfigResponse[],
) {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const type = bestOrAverage === "best" ? "single" : "average";
  const { category } = recordConfigs[0];
  const recordsUpTo = addDays(deletedResult.date, -1);
  const rankedAverageFormat = getRankedAverageFormat(event.defaultRoundFormat);
  const numberOfAttemptsCondition =
    bestOrAverage === "best" ? sql`` : sql`AND CARDINALITY(${table.attempts}) = ${rankedAverageFormat.attempts}`;
  const bestAggregate = event.higherIsBetter ? sql`MAX` : sql`MIN`;
  const recordBoundComparator = event.higherIsBetter ? sql`>=` : sql`<=`;
  const noPrevRecordBound = event.higherIsBetter ? 1 : C.maxResult;

  // Set WRs
  if (deletedResult[recordField] === "WR") {
    const prevWrResult = await getRecordResult(event, bestOrAverage, "WR", category, { tx: db, recordsUpTo });

    const newWrIds = await db
      .execute(sql`
        WITH day_min_times AS (
          SELECT ${table.id}, ${table.date}, ${table[bestOrAverage]},
            ${bestAggregate}(${table[bestOrAverage]}) OVER(PARTITION BY ${table.date}
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS day_min_time
          FROM ${table}
          WHERE ${table.organizationId} = ${event.organizationId}
            AND ${table[bestOrAverage]} > 0
            AND ${table[bestOrAverage]} ${recordBoundComparator} ${prevWrResult ? prevWrResult[bestOrAverage] : noPrevRecordBound}
            AND ${table.eventId} = ${deletedResult.eventId}
            AND ${table.date} >= ${deletedResult.date.toISOString()}
            AND ${table.recordCategory} = ${category}
            ${numberOfAttemptsCondition}
          ORDER BY ${table.date}
        ), results_with_record_times AS (
          SELECT id, ${bestAggregate}(day_min_time) OVER(ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS curr_record
          FROM day_min_times
          ORDER BY date
        )
        SELECT ${table.id}
        FROM ${table} RIGHT JOIN results_with_record_times
          ON ${table.id} = results_with_record_times.id
        WHERE (${table[recordField]} IS NULL OR ${table[recordField]} <> 'WR')
          AND ${table[bestOrAverage]} = results_with_record_times.curr_record`)
      // PGLite returns results with { rows: [] }, but Postgres just returns [], hence the different mapping
      .then((val: any) => (process.env.VITEST ? val.rows : val).map(({ id }: any) => id));

    const newWrResults = await db
      .update(table)
      .set({ [recordField]: "WR" })
      .where(inArray(table.id, newWrIds))
      .returning({ date: table.date, [bestOrAverage]: table[bestOrAverage] });

    for (const wr of newWrResults) {
      const date = format(wr.date, "d MMM yyyy");
      logMessage("RR0025", `New ${type} WR for event ${deletedResult.eventId}: ${wr[bestOrAverage]} (${date})`);
    }
  }

  // Set CRs
  if (deletedResult.superRegionCode && deletedResult[recordField] !== "NR") {
    const crType = (await db.query.regions.findFirst({
      where: { organizationId: event.organizationId, type: "super-region", code: deletedResult.superRegionCode },
    }))!.superRegionRecordType!;
    const prevCrResult = await getRecordResult(event, bestOrAverage, crType, category, { tx: db, recordsUpTo });

    const newCrIds = await db
      .execute(sql`
        WITH day_min_times AS (
          SELECT ${table.id}, ${table.date}, ${table[bestOrAverage]},
            ${bestAggregate}(${table[bestOrAverage]}) OVER(PARTITION BY ${table.date}
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS day_min_time
          FROM ${table}
          WHERE ${table.organizationId} = ${event.organizationId}
            AND ${table[bestOrAverage]} > 0
            AND ${table[bestOrAverage]} ${recordBoundComparator} ${prevCrResult ? prevCrResult[bestOrAverage] : noPrevRecordBound}
            AND ${table.eventId} = ${deletedResult.eventId}
            AND ${table.date} >= ${deletedResult.date.toISOString()}
            AND ${table.superRegionCode} = ${deletedResult.superRegionCode}
            AND ${table.recordCategory} = ${category}
            ${numberOfAttemptsCondition}
          ORDER BY ${table.date}
        ), results_with_record_times AS (
          SELECT id, ${bestAggregate}(day_min_time) OVER(ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS curr_record
          FROM day_min_times
          ORDER BY date
        )
        SELECT ${table.id}
        FROM ${table} RIGHT JOIN results_with_record_times
          ON ${table.id} = results_with_record_times.id
        WHERE (${table[recordField]} IS NULL OR ${table[recordField]} = 'NR')
          AND ${table[bestOrAverage]} = results_with_record_times.curr_record`)
      // PGLite returns results with { rows: [] }, but Postgres just returns [], hence the different mapping
      .then((val: any) => (process.env.VITEST ? val.rows : val).map(({ id }: any) => id));

    const newCrResults = await db
      .update(table)
      .set({ [recordField]: crType })
      .where(inArray(table.id, newCrIds))
      .returning({ date: table.date, [bestOrAverage]: table[bestOrAverage] });

    for (const cr of newCrResults) {
      const date = format(cr.date, "d MMM yyyy");
      logMessage("RR0025", `New ${type} ${crType} for event ${deletedResult.eventId}: ${cr[bestOrAverage]} (${date})`);
    }
  }

  // Set NRs
  if (deletedResult.regionCode) {
    const prevNrResult = await getRecordResult(event, bestOrAverage, "NR", category, {
      tx: db,
      recordsUpTo,
      regionCode: deletedResult.regionCode,
    });

    const newNrIds = await db
      .execute(sql`
        WITH day_min_times AS (
          SELECT ${table.id}, ${table.date}, ${table[bestOrAverage]},
            ${bestAggregate}(${table[bestOrAverage]}) OVER(PARTITION BY ${table.date}
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS day_min_time
          FROM ${table}
          WHERE ${table.organizationId} = ${event.organizationId}
            AND ${table[bestOrAverage]} > 0
            AND ${table[bestOrAverage]} ${recordBoundComparator} ${prevNrResult ? prevNrResult[bestOrAverage] : noPrevRecordBound}
            AND ${table.eventId} = ${deletedResult.eventId}
            AND ${table.date} >= ${deletedResult.date.toISOString()}
            AND ${table.regionCode} = ${deletedResult.regionCode}
            AND ${table.recordCategory} = ${category}
            ${numberOfAttemptsCondition}
          ORDER BY ${table.date}
        ), results_with_record_times AS (
          SELECT id, ${bestAggregate}(day_min_time) OVER(ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS curr_record
          FROM day_min_times
          ORDER BY date
        )
        SELECT ${table.id}
        FROM ${table} RIGHT JOIN results_with_record_times
          ON ${table.id} = results_with_record_times.id
        WHERE ${table[recordField]} IS NULL
          AND ${table[bestOrAverage]} = results_with_record_times.curr_record`)
      .then((val: any) =>
        // PGLite returns results with { rows: [] }, but Postgres just returns [], hence the different mapping
        (process.env.VITEST ? val.rows : val).map(({ id }: any) => id),
      );

    const newNrResults = await db
      .update(table)
      .set({ [recordField]: "NR" })
      .where(inArray(table.id, newNrIds))
      .returning({ date: table.date, regionCode: table.regionCode, [bestOrAverage]: table[bestOrAverage] });

    for (const nr of newNrResults) {
      const date = format(nr.date, "d MMM yyyy");
      logMessage(
        "RR0025",
        `New ${type} NR (region code ${nr.regionCode}) for event ${deletedResult.eventId}: ${nr[bestOrAverage]} (${date})`,
      );
    }
  }
}

export async function cancelFutureRecords(
  db: DbTransactionType, // the tx object from a Drizzle transaction
  organizationId: string,
  result: ResultResponse,
  bestOrAverage: "best" | "average",
  recordConfigs: RecordConfigResponse[],
  higherIsBetter: boolean,
) {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const type = bestOrAverage === "best" ? "single" : "average";
  const { category } = recordConfigs[0];
  const crType = result.superRegionCode
    ? (await db.query.regions.findFirst({
        where: { organizationId, type: "super-region", code: result.superRegionCode },
      }))!.superRegionRecordType!
    : undefined;
  const crLabel = recordConfigs.find((rc) => rc.recordTypeId === crType)?.label;
  const nrLabel = recordConfigs.find((rc) => rc.recordTypeId === "NR")!.label;
  const resultComparisonCondition = higherIsBetter
    ? lt(table[bestOrAverage], result[bestOrAverage])
    : gt(table[bestOrAverage], result[bestOrAverage]);
  const baseConditions = [
    eq(table.organizationId, organizationId),
    eq(table.eventId, result.eventId),
    gte(table.date, result.date),
    resultComparisonCondition,
    eq(table.recordCategory, category),
  ];

  if (result[recordField] === "WR") {
    const wrLabel = recordConfigs.find((rc) => rc.recordTypeId === "WR")!.label;
    const recordTypes = result.regionCode ? ["WR", crType!, "NR"] : result.superRegionCode ? ["WR", crType!] : ["WR"];
    const cancelledWrCrNrResults = await db
      .update(table)
      .set({ [recordField]: null })
      .where(
        and(
          ...baseConditions,
          inArray(table[recordField], recordTypes),
          result.superRegionCode
            ? or(eq(table.superRegionCode, result.superRegionCode), isNull(table.superRegionCode))
            : isNull(table.superRegionCode),
          result.regionCode
            ? or(eq(table.regionCode, result.regionCode), isNull(table.regionCode))
            : isNull(table.regionCode),
        ),
      )
      .returning();
    for (const r of cancelledWrCrNrResults) {
      const message = `CANCELLED ${r.eventId} ${type} ${wrLabel}, ${crLabel} or ${nrLabel}: ${r[bestOrAverage]} (country code ${r.regionCode})`;
      logMessage("RR0026", message);
    }

    const wrCrChangedToNrResults = await db
      .update(table)
      .set({ [recordField]: "NR" })
      .where(
        and(
          ...baseConditions,
          inArray(table[recordField], result.superRegionCode ? ["WR", crType!] : ["WR"]),
          result.superRegionCode
            ? or(eq(table.superRegionCode, result.superRegionCode), isNull(table.superRegionCode))
            : isNull(table.superRegionCode),
          isNotNull(table.regionCode),
        ),
      )
      .returning();
    for (const r of wrCrChangedToNrResults) {
      const message = `CHANGED ${r.eventId} ${type} ${wrLabel} or ${crLabel} to ${nrLabel}: ${r[bestOrAverage]} (country code ${r.regionCode})`;
      logMessage("RR0026", message);
    }

    // Has to be done like this, because we can't dynamically determine the CR type to be set
    const wrResultsToBeChangedToCr = await db
      .select()
      .from(table)
      .where(and(...baseConditions, eq(table[recordField], "WR"), isNotNull(table.superRegionCode)));
    for (const r of wrResultsToBeChangedToCr) {
      const resultCrType = (await db.query.regions.findFirst({
        where: { organizationId, type: "super-region", code: r.superRegionCode! },
      }))!.superRegionRecordType!;
      const resultCrLabel = recordConfigs.find((rc) => rc.recordTypeId === resultCrType)!.label;
      await db
        .update(table)
        .set({ [recordField]: resultCrType })
        .where(eq(table.id, r.id))
        .returning();

      const message = `CHANGED ${r.eventId} ${type} ${wrLabel} to ${resultCrLabel}: ${r[bestOrAverage]} (country code ${r.regionCode})`;
      logMessage("RR0026", message);
    }
  } else if (result[recordField] !== "NR") {
    const cancelledCrNrResults = await db
      .update(table)
      .set({ [recordField]: null })
      .where(
        and(
          ...baseConditions,
          inArray(table[recordField], result.regionCode ? [crType!, "NR"] : [crType!]),
          eq(table.superRegionCode, result.superRegionCode!),
          result.regionCode
            ? or(eq(table.regionCode, result.regionCode), isNull(table.regionCode))
            : isNull(table.regionCode),
        ),
      )
      .returning();
    for (const r of cancelledCrNrResults) {
      const message = `CANCELLED ${r.eventId} ${type} ${crLabel} or ${nrLabel}: ${r[bestOrAverage]} (country code ${r.regionCode})`;
      logMessage("RR0026", message);
    }

    const crChangedToNrResults = await db
      .update(table)
      .set({ [recordField]: "NR" })
      .where(
        and(
          ...baseConditions,
          eq(table[recordField], crType!),
          eq(table.superRegionCode, result.superRegionCode!),
          isNotNull(table.regionCode),
        ),
      )
      .returning();
    for (const r of crChangedToNrResults) {
      const message = `CHANGED ${r.eventId} ${type} ${crLabel} to ${nrLabel}: ${r[bestOrAverage]} (country code ${r.regionCode})`;
      logMessage("RR0026", message);
    }
  } else {
    const cancelledNrResults = await db
      .update(table)
      .set({ [recordField]: null })
      .where(and(...baseConditions, eq(table[recordField], "NR"), eq(table.regionCode, result.regionCode!)))
      .returning();
    for (const r of cancelledNrResults) {
      const message = `CANCELLED ${r.eventId} ${type} ${nrLabel}: ${r[bestOrAverage]} (country code ${r.regionCode})`;
      logMessage("RR0026", message);
    }
  }
}

export async function validateContestResult({
  organizationId,
  attempts,
  personIds,
  round,
  event,
  expectedNumberOfAttempts,
}: {
  organizationId: string;
  attempts: Attempt[];
  personIds: number[];
  round: SelectRound;
  event: FullEvent;
  expectedNumberOfAttempts: number;
}): Promise<Attempt[]> {
  let outputAttempts = getTruncatedAttempts({ attempts, event });

  // Same check as in createVideoBasedResultSF()
  if (personIds.length !== event.participants) {
    throw new RrActionError(
      `This event must have ${event.participants} participant${event.participants > 1 ? "s" : ""}`,
    );
  }

  // Time limit validation
  if (round.timeLimitCentiseconds) {
    if (attempts.some((a) => a.result >= round.timeLimitCentiseconds!)) {
      throw new RrActionError(
        `This round has a time limit of ${getFormattedResult(round.timeLimitCentiseconds, { showDecimals: "never" })}`,
      );
    }

    if (round.timeLimitCumulativeRoundIds) {
      // Add up all attempt times from the new result and results from other rounds included in the cumulative time limit
      const cumulativeRoundsResults = await db.query.results.findMany({
        where: {
          organizationId,
          roundId: { in: round.timeLimitCumulativeRoundIds },
          RAW: (t) => sql`CARDINALITY(${t.personIds}) = ${personIds.length}`,
          personIds: { arrayContains: personIds },
        },
      });
      let total = 0;
      for (const res of [{ attempts } as any, ...cumulativeRoundsResults])
        for (const attempt of res.attempts) total += attempt.result;

      if (total >= round.timeLimitCentiseconds) {
        throw new RrActionError(
          `This round has a cumulative time limit of ${getFormattedResult(round.timeLimitCentiseconds, { showDecimals: "never" })}${
            round.timeLimitCumulativeRoundIds.length > 0
              ? ` for these rounds: ${round.id}, ${round.timeLimitCumulativeRoundIds.join(", ")}`
              : ""
          }`,
        );
      }
    }

    // Cutoff validation
    if (
      round.cutoffAttemptResult &&
      round.cutoffNumberOfAttempts &&
      !getMakesCutoff(attempts, round.cutoffAttemptResult, round.cutoffNumberOfAttempts)
    ) {
      if (attempts.length > round.cutoffNumberOfAttempts!) {
        const attemptsPastCutoffNumberOfAttempts = attempts.slice(round.cutoffNumberOfAttempts);
        if (attemptsPastCutoffNumberOfAttempts.some((a) => a.result !== 0)) {
          const formattedCutoff = getFormattedResult(round.cutoffAttemptResult, { showDecimals: "never" });
          throw new RrActionError(`This round has a cutoff of ${formattedCutoff}`);
        } else {
          outputAttempts = attempts.slice(0, round.cutoffNumberOfAttempts);
        }
      }

      expectedNumberOfAttempts = round.cutoffNumberOfAttempts;
    }
  }

  if (outputAttempts.length !== expectedNumberOfAttempts) {
    throw new RrActionError(
      `The number of attempts should be ${expectedNumberOfAttempts}; received: ${attempts.length}`,
    );
  }

  return outputAttempts;
}

export function getTruncatedAttempts({ attempts, event }: { attempts: Attempt[]; event: FullEvent }): Attempt[] {
  const newAttempts: Attempt[] = [];

  for (const attempt of attempts) {
    if ([0, -1, -2, C.maxTime].includes(attempt.result)) {
      newAttempts.push(attempt);
    } else {
      const [timeStr, solved, attempted] = getFormattedResult(attempt.result, {
        eventFormat: event.format,
        noDelimiterChars: true,
      }).split(";") as [timeStr: string, solved?: string, attempted?: string];
      const memoStr = attempt.memo ? getFormattedResult(attempt.memo, { noDelimiterChars: true }) : undefined;

      const newAttempt = getAttempt(attempt, event, timeStr, {
        truncateTime: !getAlwaysShowDecimals(event),
        solved: solved ? Number(solved) : undefined,
        attempted: attempted ? Number(attempted) : undefined,
        memo: memoStr,
      });
      newAttempts.push(newAttempt);
    }
  }

  return newAttempts;
}

export async function setRankingAndProceedsValues(
  db: DbTransactionType, // the tx object from a Drizzle transaction
  results: ResultResponse[],
  round: RoundResponse,
  higherIsBetter: boolean,
) {
  const roundFormat = roundFormats.find((rf) => rf.value === round.format)!;
  const sortedResults = results.sort(
    roundFormat.isAverage
      ? (a, b) => compareAvgs(a, b, { higherIsBetter, useTieBreaker: true })
      : (a, b) => compareSingles(a, b, { higherIsBetter }),
  );
  let prevResult = sortedResults[0];
  let ranking = 1;

  for (let i = 0; i < sortedResults.length; i++) {
    if (i > 0) {
      // If the previous result was not tied with this one, increase ranking
      if (
        (roundFormat.isAverage &&
          compareAvgs(prevResult, sortedResults[i], { higherIsBetter, useTieBreaker: true }) < 0) ||
        (!roundFormat.isAverage && compareSingles(prevResult, sortedResults[i], { higherIsBetter }) < 0)
      ) {
        ranking = i + 1;
      }

      prevResult = sortedResults[i];
    }

    // Set proceeds if it's a non-final round and the result proceeds to the next round
    const proceeds = round.proceedValue
      ? getResultProceeds({ ...sortedResults[i], ranking }, round, roundFormat, sortedResults)
      : null;

    // Update the result in the DB, if something changed
    if (ranking !== sortedResults[i].ranking || proceeds !== sortedResults[i].proceeds)
      await db.update(table).set({ ranking, proceeds }).where(eq(table.id, sortedResults[i].id));
  }
}

export async function getNotProceededParticipant({
  personIds,
  roundNumber,
  rounds,
}: {
  personIds: number[];
  roundNumber: number;
  rounds: Pick<SelectRound, "id" | "roundNumber">[];
}): Promise<{ notProceededParticipantIndex: number | null }> {
  if (roundNumber > 1) {
    const prevRound = rounds.find((r) => r.roundNumber === roundNumber - 1)!;
    const prevRoundResults = await db.query.results.findMany({ where: { roundId: prevRound.id } });
    const notProceededParticipantIndex = personIds.findIndex(
      (pid) => !prevRoundResults.some((r) => r.proceeds && r.personIds.includes(pid)),
    );

    if (notProceededParticipantIndex >= 0) return { notProceededParticipantIndex };
  }

  return { notProceededParticipantIndex: null };
}
