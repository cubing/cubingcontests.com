"use server";

import z from "zod";
import { actionClient, CcActionError } from "../safeAction.ts";
import type { EventWrPair, RecordType } from "~/helpers/types.ts";
import { getActiveRecordConfigs, getWrPairs } from "../serverUtilityFunctions.ts";
import { VideoBasedResultValidator } from "~/helpers/validators/Result.ts";
import { InsertResult, ResultResponse, resultsPublicCols, resultsTable as table } from "../db/schema/results.ts";
import { C } from "~/helpers/constants.ts";
import { EventResponse, eventsTable } from "../db/schema/events.ts";
import { db } from "../db/provider.ts";
import { and, arrayContains, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import {
  compareAvgs,
  compareSingles,
  getBestAndAverage,
  getDefaultAverageAttempts,
} from "~/helpers/sharedFunctions.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { personsPublicCols, personsTable } from "../db/schema/persons.ts";
import { Continents, getContinent } from "~/helpers/Countries.ts";

export const getWrPairsUpToDateSF = actionClient.metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(z.strictObject({
    recordsUpTo: z.date(),
    excludeResultId: z.int().optional(),
  })).action<EventWrPair[]>(async ({ parsedInput: { recordsUpTo, excludeResultId } }) => {
    return await getWrPairs({ recordsUpTo, excludeResultId });
  });

export const createVideoBasedResultSF = actionClient.metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(z.strictObject({
    newResultDto: VideoBasedResultValidator,
  })).action<ResultResponse>(async ({ parsedInput: { newResultDto }, ctx: { session } }) => {
    console.log(`Creating new video-based result: ${JSON.stringify(newResultDto)}`);

    const isAdmin = session.user.role === "admin";

    // Disallow admin-only features
    if (!isAdmin) {
      if (newResultDto.videoLink === "") throw new CcActionError("Please enter a video link");
      if (newResultDto.attempts.some((a) => a.result === C.maxTime)) {
        throw new CcActionError("You are not authorized to set unknown time");
      }
    }

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.eventId, newResultDto.eventId)).limit(1);

    if (newResultDto.personIds.length !== event.participants) {
      throw new CcActionError(
        `This event must have ${event.participants} participant${event.participants > 1 ? "s" : ""}`,
      );
    }
    // if (
    //   process.env.NODE_ENV === "production" &&
    //   differenceInHours(result.date, new Date()) > 36
    // ) {
    //   throw new BadRequestException(
    //     round
    //       ? "You may not enter results for a round in the future"
    //       : "The date cannot be in the future",
    //   );
    // }

    const format = roundFormats.find((rf) => rf.attempts === newResultDto.attempts.length && rf.value !== "3")!;
    const { best, average } = getBestAndAverage(newResultDto.attempts, event, format.value);
    const newResult: InsertResult = { ...newResultDto, best, average, createdBy: session.user.id };
    const { singleRecordTypes, averageRecordTypes } = await getResultRecordTypes(newResult, event);
    newResult.singleRecordTypes = singleRecordTypes;
    newResult.averageRecordTypes = averageRecordTypes;

    const [createdResult] = await db.insert(table).values(newResult).returning(resultsPublicCols) as ResultResponse[];

    if (isAdmin) {
      //   await this.personsService.approvePersons({
      //     personIds: createdResult.personIds,
      //   });

      //   await this.updateFutureRecords(createdResult, event, recordPairs, {
      //     mode: "create",
      //   });
    } else {
      //   await this.emailService.sendVideoBasedResultSubmittedNotification(
      //     user.email,
      //     event,
      //     createdResult as IVideoBasedResult,
      //     user.username,
      //   );
    }

    return createdResult;
  });

async function getResultRecordTypes(
  result: InsertResult,
  event: EventResponse,
): Promise<{ singleRecordTypes: RecordType[]; averageRecordTypes: RecordType[] }> {
  const singleRecordTypes: RecordType[] = [];
  const averageRecordTypes: RecordType[] = [];

  const activeRecordConfigs = await getActiveRecordConfigs("video-based-results");
  const competitors = await db.select(personsPublicCols).from(personsTable).where(
    inArray(personsTable.personId, result.personIds),
  );
  const isSameCountry = !competitors.some((p) => p.countryIso2 !== competitors[0].countryIso2);
  const firstCompetitorContinent = getContinent(competitors[0].countryIso2);
  const isSameContinent = isSameCountry ||
    !competitors.slice(1).some((p) => getContinent(p.countryIso2) !== firstCompetitorContinent);
  const continentalRecordType = Continents.find((c) => c.code === firstCompetitorContinent)!.recordTypeId;

  if (result.best > 0) {
    const wrRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === "WR");
    if (wrRecordConfig) {
      const [wrSingle] = await db.select({ best: table.best }).from(table).where(
        and(
          isNull(table.competitionId),
          eq(table.eventId, result.eventId),
          arrayContains(table.singleRecordTypes, ["WR"]),
          lte(table.date, result.date),
        ),
      ).orderBy(desc(table.date)).limit(1);

      const isWrSingle = !wrSingle || compareSingles(result, wrSingle) <= 0;
      if (isWrSingle) {
        console.log(`New ${result.eventId} single ${wrRecordConfig.label}: ${result.best}`);
        singleRecordTypes.push("WR");
        if (isSameContinent) singleRecordTypes.push(continentalRecordType);
        else if (isSameCountry) singleRecordTypes.push("NR");
      } else if (isSameContinent) {
        const crRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === continentalRecordType);
        if (crRecordConfig) {
          const [crSingle] = await db.select({ best: table.best }).from(table).where(
            and(
              isNull(table.competitionId),
              eq(table.eventId, result.eventId),
              arrayContains(table.singleRecordTypes, [continentalRecordType]),
              lte(table.date, result.date),
            ),
          ).orderBy(desc(table.date)).limit(1);

          const isCrSingle = !crSingle || compareSingles(result, crSingle) <= 0;
          if (isCrSingle) {
            console.log(`New ${result.eventId} single ${crRecordConfig.label}: ${result.best}`);
            singleRecordTypes.push(continentalRecordType);
            if (isSameCountry) singleRecordTypes.push("NR");
          } else if (isSameCountry) {
            const nrRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === "NR");
            if (nrRecordConfig) {
              const [nrSingle] = await db.select({ best: table.best }).from(table).where(
                and(
                  isNull(table.competitionId),
                  eq(table.eventId, result.eventId),
                  arrayContains(table.singleRecordTypes, ["NR"]),
                  lte(table.date, result.date),
                ),
              ).orderBy(desc(table.date)).limit(1);

              const isNrSingle = !nrSingle || compareSingles(result, nrSingle) <= 0;
              if (isNrSingle) {
                console.log(`New ${result.eventId} single ${nrRecordConfig.label}: ${result.best}`);
                singleRecordTypes.push("NR");
              }
            }
          }
        }
      }
    }
  }

  if (result.average > 0 && result.attempts.length === getDefaultAverageAttempts(event)) {
    const wrRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === "WR");
    if (wrRecordConfig) {
      const [wrAverage] = await db.select({ average: table.average }).from(table).where(
        and(
          isNull(table.competitionId),
          eq(table.eventId, result.eventId),
          arrayContains(table.averageRecordTypes, ["WR"]),
          lte(table.date, result.date),
        ),
      ).orderBy(desc(table.date)).limit(1);

      const isWrAverage = !wrAverage || compareAvgs(result, wrAverage) <= 0;
      if (isWrAverage) {
        console.log(`New ${result.eventId} average ${wrRecordConfig.label}: ${result.average}`);
        averageRecordTypes.push("WR");
        if (isSameContinent) averageRecordTypes.push(continentalRecordType);
        else if (isSameCountry) averageRecordTypes.push("NR");
      } else if (isSameContinent) {
        const crRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === continentalRecordType);
        if (crRecordConfig) {
          const [crAverage] = await db.select({ average: table.average }).from(table).where(
            and(
              isNull(table.competitionId),
              eq(table.eventId, result.eventId),
              arrayContains(table.averageRecordTypes, [continentalRecordType]),
              lte(table.date, result.date),
            ),
          ).orderBy(desc(table.date)).limit(1);

          const isCrAverage = !crAverage || compareAvgs(result, crAverage) <= 0;
          if (isCrAverage) {
            console.log(`New ${result.eventId} average ${crRecordConfig.label}: ${result.average}`);
            averageRecordTypes.push(continentalRecordType);
            if (isSameCountry) averageRecordTypes.push("NR");
          } else if (isSameCountry) {
            const nrRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === "NR");
            if (nrRecordConfig) {
              const [nrAverage] = await db.select({ average: table.average }).from(table).where(
                and(
                  isNull(table.competitionId),
                  eq(table.eventId, result.eventId),
                  arrayContains(table.averageRecordTypes, ["NR"]),
                  lte(table.date, result.date),
                ),
              ).orderBy(desc(table.date)).limit(1);

              const isNrAverage = !nrAverage || compareAvgs(result, nrAverage) <= 0;
              if (isNrAverage) {
                console.log(`New ${result.eventId} average ${nrRecordConfig.label}: ${result.average}`);
                averageRecordTypes.push("NR");
              }
            }
          }
        }
      }
    }
  }

  return { singleRecordTypes, averageRecordTypes };
}
