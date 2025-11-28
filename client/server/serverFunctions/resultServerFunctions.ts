"use server";

import { differenceInHours } from "date-fns";
import { and, eq, gt, gte, inArray, isNotNull, isNull, ne, or } from "drizzle-orm";
import z from "zod";
import { ContinentRecordType, getContinent } from "~/helpers/Countries.ts";
import { C } from "~/helpers/constants.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import {
  compareAvgs,
  compareSingles,
  getBestAndAverage,
  getDefaultAverageAttempts,
} from "~/helpers/sharedFunctions.ts";
import type { EventWrPair } from "~/helpers/types.ts";
import { getIsAdmin } from "~/helpers/utilityFunctions.ts";
import { VideoBasedResultValidator } from "~/helpers/validators/Result.ts";
import { db } from "../db/provider.ts";
import { type EventResponse, eventsTable } from "../db/schema/events.ts";
import { personsTable, type SelectPerson } from "../db/schema/persons.ts";
import type { RecordConfigResponse } from "../db/schema/record-configs.ts";
import {
  type InsertResult,
  type ResultResponse,
  resultsPublicCols,
  resultsTable as table,
} from "../db/schema/results.ts";
import { sendVideoBasedResultSubmittedNotification } from "../email/mailer.ts";
import { actionClient, CcActionError } from "../safeAction.ts";
import { getRecordConfigs, getRecordResult, setPersonToApproved } from "../serverUtilityFunctions.ts";

export const getWrPairUpToDateSF = actionClient
  .metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(
    z.strictObject({
      eventId: z.string(),
      recordsUpTo: z.date().optional(),
      excludeResultId: z.int().optional(),
    }),
  )
  .action<EventWrPair>(async ({ parsedInput: { eventId, recordsUpTo, excludeResultId } }) => {
    const singleWrResult = await getRecordResult(eventId, "best", "WR", "video-based-results", {
      recordsUpTo,
      excludeResultId,
    });
    const averageWrResult = await getRecordResult(eventId, "best", "WR", "video-based-results", {
      recordsUpTo,
      excludeResultId,
    });

    return { eventId, best: singleWrResult?.best, average: averageWrResult?.average };
  });

export const createVideoBasedResultSF = actionClient
  .metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(
    z.strictObject({
      newResultDto: VideoBasedResultValidator,
    }),
  )
  .action<ResultResponse>(async ({ parsedInput: { newResultDto }, ctx: { session } }) => {
    console.log(`Creating new video-based result: ${JSON.stringify(newResultDto)}`);

    const isAdmin = getIsAdmin(session.user.role);

    // Disallow admin-only features
    if (!isAdmin) {
      if (newResultDto.videoLink === "") throw new CcActionError("Please enter a video link");
      if (newResultDto.attempts.some((a) => a.result === C.maxTime)) {
        throw new CcActionError("You are not authorized to set unknown time");
      }
    }

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.eventId, newResultDto.eventId)).limit(1);

    if (!event) throw new CcActionError(`Event with ID ${newResultDto.eventId} not found`);
    if (newResultDto.personIds.length !== event.participants)
      throw new CcActionError(
        `This event must have ${event.participants} participant${event.participants > 1 ? "s" : ""}`,
      );
    if (process.env.NODE_ENV === "production" && differenceInHours(newResultDto.date, new Date()) > 36)
      throw new CcActionError("The date cannot be in the future");

    const recordConfigs = await getRecordConfigs("video-based-results");
    const format = roundFormats.find((rf) => rf.attempts === newResultDto.attempts.length && rf.value !== "3")!;
    const { best, average } = getBestAndAverage(newResultDto.attempts, event, format.value);
    const newResult: InsertResult = { ...newResultDto, best, average, createdBy: session.user.id };
    const participants = await db
      .select()
      .from(personsTable)
      .where(inArray(personsTable.personId, newResult.personIds));
    await setResultRecordsCountryAndContinent(newResult, event, recordConfigs, participants);

    const [createdResult] = await db.insert(table).values(newResult).returning(resultsPublicCols);

    if (isAdmin) {
      // THIS IS UNFINISHED CODE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // THIS IS UNFINISHED CODE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // THIS IS UNFINISHED CODE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      await Promise.allSettled(
        participants.filter((c) => !c.approved).map((c) => () => setPersonToApproved(c, { requireWcaId: false })),
      );

      await updateFutureRecords(createdResult, recordConfigs);
    } else {
      sendVideoBasedResultSubmittedNotification(session.user.email, event, createdResult, session.user.username);
    }

    return createdResult;
  });

async function setResultRecordsCountryAndContinent(
  result: InsertResult,
  event: EventResponse,
  recordConfigs: RecordConfigResponse[],
  participants: SelectPerson[],
) {
  const firstParticipantCountry = participants[0].countryIso2;
  const isSameCountryParticipants = !participants.some((p) => p.countryIso2 !== firstParticipantCountry);
  const firstParticipantContinent = getContinent(participants[0].countryIso2);
  const isSameContinentParticipants =
    isSameCountryParticipants ||
    !participants.slice(1).some((p) => getContinent(p.countryIso2) !== firstParticipantContinent);

  if (isSameCountryParticipants) result.countryIso2 = firstParticipantCountry;
  if (isSameContinentParticipants) result.continentId = firstParticipantContinent;

  if (result.best > 0) await setResultRecord(result, "best", recordConfigs);
  if (result.average > 0 && result.attempts.length === getDefaultAverageAttempts(event))
    await setResultRecord(result, "average", recordConfigs);
}

async function setResultRecord(
  result: InsertResult,
  bestOrAverage: "best" | "average",
  recordConfigs: RecordConfigResponse[],
) {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const type = bestOrAverage === "best" ? "single" : "average";
  const compareFunc = (a: any, b: any) => (bestOrAverage === "best" ? compareSingles(a, b) : compareAvgs(a, b));

  // Set WR
  const wrResult = await getRecordResult(result.eventId, bestOrAverage, "WR", "video-based-results", {
    recordsUpTo: result.date,
  });
  const isWr = !wrResult || compareFunc(result, wrResult) <= 0;

  if (isWr) {
    const wrRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === "WR")!;
    console.log(`New ${result.eventId} ${type} ${wrRecordConfig.label}: ${result[bestOrAverage]}`);
    result[recordField] = "WR";
  } else if (
    result.continentId &&
    (result.continentId !== wrResult?.continentId ||
      (result.countryIso2 && result.countryIso2 !== wrResult?.countryIso2))
  ) {
    // Set CR
    const crType = ContinentRecordType[result.continentId];
    const crResult = await getRecordResult(result.eventId, bestOrAverage, crType, "video-based-results", {
      recordsUpTo: result.date,
    });
    const isCr = !crResult || compareFunc(result, crResult) <= 0;

    if (isCr) {
      const crRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === crType)!;
      console.log(`New ${result.eventId} ${type} ${crRecordConfig.label}: ${result[bestOrAverage]}`);
      result[recordField] = crType;
    } else if (result.countryIso2 && result.countryIso2 !== crResult?.countryIso2) {
      // Set NR
      const nrResult = await getRecordResult(result.eventId, bestOrAverage, "NR", "video-based-results", {
        recordsUpTo: result.date,
        countryIso2: result.countryIso2,
      });
      const isNr = !nrResult || compareFunc(result, nrResult) <= 0;

      if (isNr) {
        const nrRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === "NR")!;
        console.log(`New ${result.eventId} ${type} ${nrRecordConfig.label}: ${result[bestOrAverage]}`);
        result[recordField] = "NR";
      }
    }
  }
}

async function updateFutureRecords(
  result: ResultResponse,
  recordConfigs: RecordConfigResponse[],
  // {
  //   mode,
  //   previousBest,
  //   previousAvg,
  // }:
  //   | {
  //       mode: "create" | "delete";
  //       previousBest?: undefined;
  //       previousAvg?: undefined;
  //     }
  //   | {
  //       mode: "edit";
  //       previousBest: number;
  //       previousAvg: number;
  //     },
) {
  // const singlesComparison = mode === "edit" ? compareSingles(result, { best: previousBest }) : 0;
  // const singleGotWorse = singlesComparison > 0 || (mode === "delete" && result.best > 0);
  // const singleGotBetter = singlesComparison < 0 || (mode === "create" && result.best > 0);
  // if (singleGotWorse || singleGotBetter) {}

  if (result.regionalSingleRecord) await cancelFutureRecords(result, "best", recordConfigs);
  if (result.regionalAverageRecord) await cancelFutureRecords(result, "average", recordConfigs);
}

async function cancelFutureRecords(
  result: ResultResponse,
  bestOrAverage: "best" | "average",
  recordConfigs: RecordConfigResponse[],
) {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const type = bestOrAverage === "best" ? "single" : "average";
  const crType = result.continentId ? ContinentRecordType[result.continentId] : undefined;
  const crLabel = recordConfigs.find((rc) => rc.recordTypeId === crType)?.label;
  const nrLabel = recordConfigs.find((rc) => rc.recordTypeId === "NR")!.label;
  const baseConditions = [
    isNull(table.competitionId),
    eq(table.eventId, result.eventId),
    gte(table.date, result.date),
    gt(table[bestOrAverage], result[bestOrAverage]),
  ];

  if (result[recordField] === "WR") {
    const wrLabel = recordConfigs.find((rc) => rc.recordTypeId === "WR")!.label;
    const cancelledWrCrNrResults = await db
      .update(table)
      .set({ [recordField]: null })
      .where(
        and(
          ...baseConditions,
          result.countryIso2
            ? inArray(table[recordField], ["WR", crType!, "NR"])
            : result.continentId
              ? inArray(table[recordField], ["WR", crType!])
              : eq(table[recordField], "WR"),
          result.continentId
            ? or(eq(table.continentId, result.continentId), isNull(table.continentId))
            : isNull(table.continentId),
          result.countryIso2
            ? or(eq(table.countryIso2, result.countryIso2), isNull(table.countryIso2))
            : isNull(table.countryIso2),
        ),
      )
      .returning();
    for (const r of cancelledWrCrNrResults)
      console.log(
        `CANCELLED ${r.eventId} ${type} ${wrLabel}, ${crLabel} or ${nrLabel}: ${r[bestOrAverage]} (country code ${r.countryIso2})`,
      );

    const wrCrChangedToNrResults = await db
      .update(table)
      .set({ [recordField]: "NR" })
      .where(
        and(
          ...baseConditions,
          result.continentId ? inArray(table[recordField], ["WR", crType!]) : eq(table[recordField], "WR"),
          result.continentId
            ? or(eq(table.continentId, result.continentId), isNull(table.continentId))
            : isNull(table.continentId),
          isNotNull(table.countryIso2),
          result.countryIso2 ? ne(table.countryIso2, result.countryIso2) : undefined,
        ),
      )
      .returning();
    for (const r of wrCrChangedToNrResults)
      console.log(
        `CHANGED ${r.eventId} ${type} ${wrLabel} or ${crLabel} to ${nrLabel}: ${r[bestOrAverage]} (country code ${r.countryIso2})`,
      );

    // Has to be done like this, because we can't dynamically determine the CR type to be set
    const wrResultsToBeChangedToCr = await db
      .select()
      .from(table)
      .where(
        and(
          ...baseConditions,
          eq(table[recordField], "WR"),
          isNotNull(table.continentId),
          result.continentId ? ne(table.continentId, result.continentId) : undefined,
        ),
      );
    for (const r of wrResultsToBeChangedToCr) {
      const resultCrType = ContinentRecordType[r.continentId!];
      const resultCrLabel = recordConfigs.find((rc) => rc.recordTypeId === resultCrType)!.label;
      await db
        .update(table)
        .set({ [recordField]: resultCrType })
        .where(eq(table.id, r.id))
        .returning();
      console.log(
        `CHANGED ${r.eventId} ${type} ${wrLabel} to ${resultCrLabel}: ${r[bestOrAverage]} (country code ${r.countryIso2})`,
      );
    }
  } else if (["ER", "NAR", "SAR", "AsR", "AfR", "OcR"].includes(result[recordField]!)) {
    const cancelledCrNrResults = await db
      .update(table)
      .set({ [recordField]: null })
      .where(
        and(
          ...baseConditions,
          result.countryIso2 ? inArray(table[recordField], [crType!, "NR"]) : eq(table[recordField], crType!),
          eq(table.continentId, result.continentId!),
          result.countryIso2
            ? or(eq(table.countryIso2, result.countryIso2), isNull(table.countryIso2))
            : isNull(table.countryIso2),
        ),
      )
      .returning();
    for (const r of cancelledCrNrResults)
      console.log(
        `CANCELLED ${r.eventId} ${type} ${crLabel} or ${nrLabel}: ${r[bestOrAverage]} (country code ${r.countryIso2})`,
      );

    const crChangedToNrResults = await db
      .update(table)
      .set({ [recordField]: "NR" })
      .where(
        and(
          ...baseConditions,
          eq(table[recordField], crType!),
          eq(table.continentId, result.continentId!),
          isNotNull(table.countryIso2),
          result.countryIso2 ? ne(table.countryIso2, result.countryIso2) : undefined,
        ),
      )
      .returning();
    for (const r of crChangedToNrResults)
      console.log(
        `CHANGED ${r.eventId} ${type} ${crLabel} to ${nrLabel}: ${r[bestOrAverage]} (country code ${r.countryIso2})`,
      );
  } else if (result[recordField] === "NR") {
    const cancelledNrResults = await db
      .update(table)
      .set({ [recordField]: null })
      .where(and(...baseConditions, eq(table[recordField], "NR"), eq(table.countryIso2, result.countryIso2!)))
      .returning();

    for (const r of cancelledNrResults)
      console.log(`CANCELLED ${r.eventId} ${type} ${nrLabel}: ${r[bestOrAverage]} (country code ${r.countryIso2})`);
  }
}
