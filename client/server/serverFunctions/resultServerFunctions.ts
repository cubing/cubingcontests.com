"use server";

import { and, eq, gt, gte, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import z from "zod";
import { ContinentRecordType, getSuperRegion } from "~/helpers/Countries.ts";
import { C } from "~/helpers/constants.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import {
  compareAvgs,
  compareSingles,
  getBestAndAverage,
  getDefaultAverageAttempts,
  getFormattedTime,
  getIsProceedableResult,
  getMakesCutoff,
  getRoundDate,
} from "~/helpers/sharedFunctions.ts";
import { type ContinentCode, type EventWrPair, RecordCategoryValues, type RecordType } from "~/helpers/types.ts";
import { getIsAdmin } from "~/helpers/utilityFunctions.ts";
import { ResultValidator, VideoBasedResultValidator } from "~/helpers/validators/Result.ts";
import { contestsTable, type SelectContest } from "~/server/db/schema/contests.ts";
import { logMessageSF } from "~/server/serverFunctions/serverFunctions.ts";
import { type DbTransactionType, db } from "../db/provider.ts";
import type { EventResponse } from "../db/schema/events.ts";
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
import { getRecordConfigs, getRecordResult, getUserHasAccessToContest } from "../serverUtilityFunctions.ts";

export const getWrPairUpToDateSF = actionClient
  .metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(
    z.strictObject({
      recordCategory: z.enum(RecordCategoryValues),
      eventId: z.string(),
      recordsUpTo: z.date().optional(),
      excludeResultId: z.int().optional(),
    }),
  )
  .action<EventWrPair>(async ({ parsedInput: { recordCategory, eventId, recordsUpTo, excludeResultId } }) => {
    const singleWrResult = await getRecordResult(eventId, "best", "WR", recordCategory, {
      recordsUpTo,
      excludeResultId,
    });
    const averageWrResult = await getRecordResult(eventId, "average", "WR", recordCategory, {
      recordsUpTo,
      excludeResultId,
    });

    return { eventId, best: singleWrResult?.best, average: averageWrResult?.average };
  });

export const createContestResultSF = actionClient
  .metadata({ permissions: { competitions: ["create"], meetups: ["create"] } })
  .inputSchema(
    z.strictObject({
      newResultDto: ResultValidator,
    }),
  )
  .action<ResultResponse[]>(
    async ({
      parsedInput: { newResultDto },
      ctx: {
        session: { user },
      },
    }) => {
      const { eventId, personIds, competitionId, roundId } = newResultDto;
      logMessageSF({
        message: `Creating new contest result for contest ${competitionId}, event ${eventId}, round ${roundId} and persons ${personIds.join(", ")}: ${JSON.stringify(newResultDto.attempts)}`,
      });

      const contestPromise = db.query.contests.findFirst({
        where: { competitionId, state: { in: ["approved", "ongoing"] } },
      });
      const eventPromise = db.query.events.findFirst({ where: { eventId } });
      const roundsPromise = db.query.rounds.findMany({ where: { competitionId, eventId } });
      const resultsPromise = db.query.results.findMany({ where: { roundId }, orderBy: { ranking: "asc" } });
      const personsPromise = db.query.persons.findMany({ where: { id: { in: personIds } } });

      const [contest, event, rounds, roundResults, participants] = await Promise.all([
        contestPromise,
        eventPromise,
        roundsPromise,
        resultsPromise,
        personsPromise,
      ]);
      const round = rounds.find((r) => r.id === roundId);

      if (!contest) throw new CcActionError(`Contest with ID ${competitionId} not found or it can't accept results`);
      if (!getUserHasAccessToContest(user, contest.organizerIds))
        throw new CcActionError("You do not have access rights for this contest");
      if (!event) throw new CcActionError(`Event with ID ${newResultDto.eventId} not found`);
      if (!round) throw new CcActionError(`Round with ID ${newResultDto.roundId} not found`);
      if (!round.open) throw new CcActionError("The round is not open");
      // Same check as in createVideoBasedResultSF
      if (newResultDto.personIds.length !== event.participants)
        throw new CcActionError(
          `This event must have ${event.participants} participant${event.participants > 1 ? "s" : ""}`,
        );
      if (roundResults.some((r) => r.personIds.some((pid) => newResultDto.personIds.includes(pid))))
        throw new CcActionError("The competitor(s) already has a result in this round");
      // Check that all of the participants have proceeded to this round
      if (round.roundNumber > 1) {
        const prevRound = rounds.find((r) => r.roundNumber === round.roundNumber - 1)!;
        const prevRoundResults = await db.query.results.findMany({ where: { roundId: prevRound.id } });
        const notProceededCompetitorIndex = newResultDto.personIds.findIndex(
          (pid) => !prevRoundResults.some((r) => r.proceeds && r.personIds.includes(pid)),
        );

        if (notProceededCompetitorIndex >= 0) {
          throw new CcActionError(
            `Competitor${event.participants > 1 ? ` ${notProceededCompetitorIndex + 1}` : ""} has not proceeded to this round`,
          );
        }
      }

      const format = roundFormats.find((rf) => rf.value === round.format)!;

      // Time limit validation
      if (round.timeLimitCentiseconds) {
        if (newResultDto.attempts.some((a) => a.result > round.timeLimitCentiseconds!))
          throw new CcActionError(`This round has a time limit of ${getFormattedTime(round.timeLimitCentiseconds)}`);

        if (round.timeLimitCumulativeRoundIds) {
          // Add up all attempt times from the new result and results from other rounds included in the cumulative time limit
          const cumulativeRoundsResults = await db.query.results.findMany({
            where: {
              roundId: { in: round.timeLimitCumulativeRoundIds },
              RAW: (t) => sql`cardinality(${t.personIds}) = ${newResultDto.personIds.length}`,
              personIds: { arrayContains: newResultDto.personIds },
            },
          });
          let total = 0;
          for (const res of [newResultDto as any, ...cumulativeRoundsResults])
            for (const attempt of res.attempts) total += attempt.result;

          if (total >= round.timeLimitCentiseconds) {
            throw new CcActionError(
              `This round has a cumulative time limit of ${getFormattedTime(round.timeLimitCentiseconds)}${
                round.timeLimitCumulativeRoundIds.length > 0
                  ? ` for these rounds: ${round.timeLimitCumulativeRoundIds.join(", ")}`
                  : ""
              }`,
            );
          }
        }

        // Cutoff validation
        if (round.cutoffAttemptResult && round.cutoffNumberOfAttempts) {
          if (getMakesCutoff(newResultDto.attempts, round.cutoffAttemptResult, round.cutoffNumberOfAttempts)) {
            if (newResultDto.attempts.length !== format.attempts) {
              throw new CcActionError(
                `The number of attempts should be ${format.attempts}; received: ${newResultDto.attempts.length}`,
              );
            }
          } else if (newResultDto.attempts.length > round.cutoffNumberOfAttempts!) {
            const attemptsPastCutoffNumberOfAttempts = newResultDto.attempts.slice(round.cutoffNumberOfAttempts);
            if (attemptsPastCutoffNumberOfAttempts.some((a) => a.result !== 0))
              throw new CcActionError(`This round has a cutoff of ${getFormattedTime(round.cutoffAttemptResult)}`);
            else newResultDto.attempts = newResultDto.attempts.slice(0, round.cutoffNumberOfAttempts);
          } else if (newResultDto.attempts.length < round.cutoffNumberOfAttempts) {
            throw new CcActionError(
              `The number of attempts should be ${round.cutoffNumberOfAttempts}; received: ${newResultDto.attempts.length}`,
            );
          }
        }
      }

      const recordConfigs = await getRecordConfigs(contest.type === "meetup" ? "meetups" : "competitions");
      const { best, average } = getBestAndAverage(newResultDto.attempts, event, format.value);
      const newResult: InsertResult = {
        eventId,
        date: getRoundDate(round, contest),
        personIds,
        attempts: newResultDto.attempts,
        best,
        average,
        recordCategory: contest.type === "meetup" ? "meetups" : "competitions",
        competitionId,
        roundId,
        ranking: 1, // gets set to the correct value below
        createdBy: user.id,
      };

      await setResultRecordsAndRegions(newResult, event, recordConfigs, participants);

      await db.transaction(async (tx) => {
        const [createdResult] = await tx.insert(table).values(newResult).returning();

        // Update contest state and participants
        const updateContestObject: Partial<SelectContest> = {};
        if (contest.state === "approved") updateContestObject.state = "ongoing";
        const participantIds = new Set<number>();
        const results = await tx.query.results.findMany({ columns: { personIds: true }, where: { competitionId } });
        for (const result of results) for (const personId of result.personIds) participantIds.add(personId);
        if (participantIds.size !== contest.participants) updateContestObject.participants = participantIds.size;
        // Do update, if some value actually changed
        if (Object.keys(updateContestObject).length > 0)
          await tx.update(contestsTable).set(updateContestObject).where(eq(contestsTable.competitionId, competitionId));

        await updateFutureRecords(tx, createdResult, recordConfigs);

        // Set ranking and proceeds values
        const sortedResults = [...roundResults, createdResult].sort(
          format.isAverage ? (a, b) => compareAvgs(a, b, true) : compareSingles,
        );
        let prevResult = sortedResults[0];
        let ranking = 1;

        for (let i = 0; i < sortedResults.length; i++) {
          // If the previous result was not tied with this one, increase ranking
          if (
            i > 0 &&
            ((format.isAverage && compareAvgs(prevResult, sortedResults[i]) < 0) ||
              (!format.isAverage && compareSingles(prevResult, sortedResults[i]) < 0))
          ) {
            ranking = i + 1;
          }

          prevResult = sortedResults[i];
          let proceeds: boolean | null = null;

          // Set proceeds if it's a non-final round and the result proceeds to the next round
          if (round.proceedValue) {
            proceeds =
              getIsProceedableResult(sortedResults[i], format) &&
              ranking <= Math.floor(sortedResults.length * 0.75) && // extra check for top 75%
              ranking <=
                (round.proceedType === "number"
                  ? round.proceedValue
                  : Math.floor((sortedResults.length * round.proceedValue) / 100));
          }

          // Update the result in the DB, if something changed
          if (ranking !== sortedResults[i].ranking || proceeds !== sortedResults[i].proceeds)
            await tx.update(table).set({ ranking, proceeds }).where(eq(table.id, sortedResults[i].id));
        }
      });

      return await db.select(resultsPublicCols).from(table).where(eq(table.roundId, roundId)).orderBy(table.ranking);
    },
  );

export const createVideoBasedResultSF = actionClient
  .metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(
    z.strictObject({
      newResultDto: VideoBasedResultValidator,
    }),
  )
  .action<ResultResponse>(
    async ({
      parsedInput: { newResultDto },
      ctx: {
        session: { user },
      },
    }) => {
      logMessageSF({ message: `Creating new video-based result: ${JSON.stringify(newResultDto)}` });

      const isAdmin = getIsAdmin(user.role);

      // Disallow admin-only features
      if (!isAdmin) {
        if (newResultDto.videoLink === "") throw new CcActionError("Please enter a video link");
        if (newResultDto.attempts.some((a) => a.result === C.maxTime))
          throw new CcActionError("You are not authorized to set unknown time");
      }

      const event = await db.query.events.findFirst({ where: { eventId: newResultDto.eventId } });
      if (!event) throw new CcActionError(`Event with ID ${newResultDto.eventId} not found`);

      // Same check as in createContestResultSF
      if (newResultDto.personIds.length !== event.participants)
        throw new CcActionError(
          `This event must have ${event.participants} participant${event.participants > 1 ? "s" : ""}`,
        );

      const recordConfigs = await getRecordConfigs("video-based-results");
      const participants = await db.select().from(personsTable).where(inArray(personsTable.id, newResultDto.personIds));
      const format = roundFormats.find((rf) => rf.attempts === newResultDto.attempts.length && rf.value !== "3")!;
      const { best, average } = getBestAndAverage(newResultDto.attempts, event, format.value);
      const newResult: InsertResult = {
        ...newResultDto,
        best,
        average,
        recordCategory: "video-based-results",
        approved: isAdmin,
        createdBy: user.id,
      };

      await setResultRecordsAndRegions(newResult, event, recordConfigs, participants);

      const createdResult = await db.transaction(async (tx) => {
        const [createdResult] = await tx.insert(table).values(newResult).returning(resultsPublicCols);

        if (isAdmin) await updateFutureRecords(tx, createdResult, recordConfigs);

        return createdResult;
      });

      if (!isAdmin) sendVideoBasedResultSubmittedNotification(user.email, event, createdResult, user.username);

      return createdResult;
    },
  );

async function setResultRecordsAndRegions(
  result: InsertResult,
  event: EventResponse,
  recordConfigs: RecordConfigResponse[], // must be of the same category
  participants: SelectPerson[],
) {
  const firstParticipantRegion = participants[0].regionCode;
  const isSameRegionParticipants = participants.every((p) => p.regionCode === firstParticipantRegion);
  const firstParticipantSuperRegion = getSuperRegion(participants[0].regionCode);
  const isSameSuperRegionParticipants =
    isSameRegionParticipants ||
    participants.slice(1).every((p) => getSuperRegion(p.regionCode) === firstParticipantSuperRegion);

  if (isSameRegionParticipants) result.regionCode = firstParticipantRegion;
  if (isSameSuperRegionParticipants) result.superRegionCode = firstParticipantSuperRegion;

  if (result.best > 0) await setResultRecord(result, "best", recordConfigs);
  if (result.average > 0 && result.attempts.length === getDefaultAverageAttempts(event))
    await setResultRecord(result, "average", recordConfigs);
}

async function setResultRecord(
  result: InsertResult,
  bestOrAverage: "best" | "average",
  recordConfigs: RecordConfigResponse[], // must be of the same category
) {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const type = bestOrAverage === "best" ? "single" : "average";
  const { category } = recordConfigs[0];
  const compareFunc = (a: any, b: any) => (bestOrAverage === "best" ? compareSingles(a, b) : compareAvgs(a, b));

  // Set WR
  const wrResult = await getRecordResult(result.eventId, bestOrAverage, "WR", category, { recordsUpTo: result.date });
  const isWr = !wrResult || compareFunc(result, wrResult) <= 0;

  if (isWr) {
    const wrRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === "WR")!;
    logMessageSF({ message: `New ${result.eventId} ${type} ${wrRecordConfig.label}: ${result[bestOrAverage]}` });
    result[recordField] = "WR";
  } else if (
    result.superRegionCode &&
    (result.superRegionCode !== wrResult?.superRegionCode ||
      (result.regionCode && result.regionCode !== wrResult?.regionCode))
  ) {
    // Set CR
    const crType = ContinentRecordType[result.superRegionCode as ContinentCode];
    const crResult = await getRecordResult(result.eventId, bestOrAverage, crType, category, {
      recordsUpTo: result.date,
    });
    const isCr = !crResult || compareFunc(result, crResult) <= 0;

    if (isCr) {
      const crRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === crType)!;
      logMessageSF({ message: `New ${result.eventId} ${type} ${crRecordConfig.label}: ${result[bestOrAverage]}` });
      result[recordField] = crType;
    } else if (result.regionCode && result.regionCode !== crResult?.regionCode) {
      // Set NR
      const nrResult = await getRecordResult(result.eventId, bestOrAverage, "NR", category, {
        recordsUpTo: result.date,
        regionCode: result.regionCode,
      });
      const isNr = !nrResult || compareFunc(result, nrResult) <= 0;

      if (isNr) {
        const nrRecordConfig = recordConfigs.find((rc) => rc.recordTypeId === "NR")!;
        logMessageSF({ message: `New ${result.eventId} ${type} ${nrRecordConfig.label}: ${result[bestOrAverage]}` });
        result[recordField] = "NR";
      }
    }
  }
}

async function updateFutureRecords(
  tx: DbTransactionType,
  result: ResultResponse,
  recordConfigs: RecordConfigResponse[], // must be of the same category
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

  if (result.regionalSingleRecord) await cancelFutureRecords(tx, result, "best", recordConfigs);
  if (result.regionalAverageRecord) await cancelFutureRecords(tx, result, "average", recordConfigs);
}

async function cancelFutureRecords(
  tx: DbTransactionType,
  result: ResultResponse,
  bestOrAverage: "best" | "average",
  recordConfigs: RecordConfigResponse[],
) {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const type = bestOrAverage === "best" ? "single" : "average";
  const { category } = recordConfigs[0];
  const crType = result.superRegionCode ? ContinentRecordType[result.superRegionCode as ContinentCode] : undefined;
  const crLabel = recordConfigs.find((rc) => rc.recordTypeId === crType)?.label;
  const nrLabel = recordConfigs.find((rc) => rc.recordTypeId === "NR")!.label;
  const baseConditions = [
    eq(table.eventId, result.eventId),
    gte(table.date, result.date),
    gt(table[bestOrAverage], result[bestOrAverage]),
    eq(table.recordCategory, category),
  ];

  if (result[recordField] === "WR") {
    const wrLabel = recordConfigs.find((rc) => rc.recordTypeId === "WR")!.label;
    const recordTypes = result.regionCode ? ["WR", crType!, "NR"] : result.superRegionCode ? ["WR", crType!] : ["WR"];
    const cancelledWrCrNrResults = await tx
      .update(table)
      .set({ [recordField]: null })
      .where(
        and(
          ...baseConditions,
          inArray(table[recordField], recordTypes as RecordType[]),
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
      logMessageSF({ message });
    }

    const wrCrChangedToNrResults = await tx
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
      logMessageSF({ message });
    }

    // Has to be done like this, because we can't dynamically determine the CR type to be set
    const wrResultsToBeChangedToCr = await tx
      .select()
      .from(table)
      .where(and(...baseConditions, eq(table[recordField], "WR"), isNotNull(table.superRegionCode)));
    for (const r of wrResultsToBeChangedToCr) {
      const resultCrType = ContinentRecordType[r.superRegionCode as ContinentCode];
      const resultCrLabel = recordConfigs.find((rc) => rc.recordTypeId === resultCrType)!.label;
      await tx
        .update(table)
        .set({ [recordField]: resultCrType })
        .where(eq(table.id, r.id))
        .returning();

      const message = `CHANGED ${r.eventId} ${type} ${wrLabel} to ${resultCrLabel}: ${r[bestOrAverage]} (country code ${r.regionCode})`;
      logMessageSF({ message });
    }
  } else if (["ER", "NAR", "SAR", "AsR", "AfR", "OcR"].includes(result[recordField]!)) {
    const cancelledCrNrResults = await tx
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
      logMessageSF({ message });
    }

    const crChangedToNrResults = await tx
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
      logMessageSF({ message });
    }
  } else if (result[recordField] === "NR") {
    const cancelledNrResults = await tx
      .update(table)
      .set({ [recordField]: null })
      .where(and(...baseConditions, eq(table[recordField], "NR"), eq(table.regionCode, result.regionCode!)))
      .returning();
    for (const r of cancelledNrResults) {
      const message = `CANCELLED ${r.eventId} ${type} ${nrLabel}: ${r[bestOrAverage]} (country code ${r.regionCode})`;
      logMessageSF({ message });
    }
  }
}
