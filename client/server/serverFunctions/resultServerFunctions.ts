"use server";

import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import z from "zod";
import { Continents, getContinent } from "~/helpers/Countries.ts";
import { C } from "~/helpers/constants.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import {
  compareAvgs,
  compareSingles,
  getBestAndAverage,
  getDefaultAverageAttempts,
} from "~/helpers/sharedFunctions.ts";
import type { EventWrPair } from "~/helpers/types.ts";
import { VideoBasedResultValidator } from "~/helpers/validators/Result.ts";
import { db } from "../db/provider.ts";
import { type EventResponse, eventsTable } from "../db/schema/events.ts";
import { personsTable, type SelectPerson } from "../db/schema/persons.ts";
import {
  type InsertResult,
  type ResultResponse,
  resultsPublicCols,
  resultsTable as table,
} from "../db/schema/results.ts";
import { actionClient, CcActionError } from "../safeAction.ts";
import { getActiveRecordConfigs, getWrPairs, setPersonToApproved } from "../serverUtilityFunctions.ts";

export const getWrPairsUpToDateSF = actionClient
  .metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(
    z.strictObject({
      recordsUpTo: z.date(),
      excludeResultId: z.int().optional(),
    }),
  )
  .action<EventWrPair[]>(async ({ parsedInput: { recordsUpTo, excludeResultId } }) => {
    return await getWrPairs({ recordsUpTo, excludeResultId });
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

    const isAdmin = session.user.role === "admin";

    // Disallow admin-only features
    if (!isAdmin) {
      if (newResultDto.videoLink === "") throw new CcActionError("Please enter a video link");
      if (newResultDto.attempts.some((a) => a.result === C.maxTime)) {
        throw new CcActionError("You are not authorized to set unknown time");
      }
    }

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.eventId, newResultDto.eventId)).limit(1);

    if (!event) {
      throw new CcActionError(`Event with ID ${newResultDto.eventId} not found`);
    } else if (newResultDto.personIds.length !== event.participants) {
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
    const participants = await db
      .select()
      .from(personsTable)
      .where(inArray(personsTable.personId, newResult.personIds));
    await setResultRecordsCountryAndContinent(newResult, event, participants);

    const [createdResult] = (await db.insert(table).values(newResult).returning(resultsPublicCols)) as ResultResponse[];

    if (isAdmin) {
      // await Promise.allSettled(
      //   participants.filter((c) => !c.approved).map((c) => () => setPersonToApproved(c, { requireWcaId: false })),
      // );
      // await updateFutureRecords(createdResult, event, recordPairs, { mode: "create" });
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

async function setResultRecordsCountryAndContinent(
  result: InsertResult,
  event: EventResponse,
  participants: SelectPerson[],
) {
  const activeRecordConfigs = await getActiveRecordConfigs("video-based-results");
  const firstParticipantCountry = participants[0].countryIso2;
  const isSameCountryParticipants = !participants.some((p) => p.countryIso2 !== firstParticipantCountry);
  const firstParticipantContinent = getContinent(participants[0].countryIso2);
  const isSameContinentParticipants =
    isSameCountryParticipants ||
    !participants.slice(1).some((p) => getContinent(p.countryIso2) !== firstParticipantContinent);
  const continentalRecordType = Continents.find((c) => c.code === firstParticipantContinent)!.recordTypeId;

  if (isSameCountryParticipants) result.countryIso2 = firstParticipantCountry;
  if (isSameContinentParticipants) result.continentId = firstParticipantContinent;

  if (result.best > 0) {
    const wrRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === "WR");
    if (wrRecordConfig) {
      // Set WR single
      const [wrSingle] = await db
        .select({ best: table.best, continentId: table.continentId })
        .from(table)
        .where(
          and(
            isNull(table.competitionId),
            eq(table.eventId, result.eventId),
            eq(table.regionalSingleRecord, "WR"),
            lte(table.date, result.date),
          ),
        )
        .orderBy(desc(table.date))
        .limit(1);

      const isWrSingle = !wrSingle || compareSingles(result, wrSingle) <= 0;
      if (isWrSingle) {
        console.log(`New ${result.eventId} single ${wrRecordConfig.label}: ${result.best}`);
        result.regionalSingleRecord = "WR";
      } else if (isSameContinentParticipants && firstParticipantContinent !== wrSingle?.continentId) {
        const crRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === continentalRecordType);
        if (crRecordConfig) {
          // Set CR single
          const [crSingle] = await db
            .select({ best: table.best, countryIso2: table.countryIso2 })
            .from(table)
            .where(
              and(
                isNull(table.competitionId),
                eq(table.eventId, result.eventId),
                eq(table.continentId, firstParticipantContinent),
                eq(table.regionalSingleRecord, continentalRecordType),
                lte(table.date, result.date),
              ),
            )
            .orderBy(desc(table.date))
            .limit(1);

          const isCrSingle = !crSingle || compareSingles(result, crSingle) <= 0;
          if (isCrSingle) {
            console.log(`New ${result.eventId} single ${crRecordConfig.label}: ${result.best}`);
            result.regionalSingleRecord = continentalRecordType;
          } else if (isSameCountryParticipants && firstParticipantCountry !== crSingle?.countryIso2) {
            const nrRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === "NR");
            if (nrRecordConfig) {
              // Set NR single
              const [nrSingle] = await db
                .select({ best: table.best })
                .from(table)
                .where(
                  and(
                    isNull(table.competitionId),
                    eq(table.eventId, result.eventId),
                    eq(table.countryIso2, firstParticipantCountry),
                    eq(table.regionalSingleRecord, "NR"),
                    lte(table.date, result.date),
                  ),
                )
                .orderBy(desc(table.date))
                .limit(1);

              const isNrSingle = !nrSingle || compareSingles(result, nrSingle) <= 0;
              if (isNrSingle) {
                console.log(`New ${result.eventId} single ${nrRecordConfig.label}: ${result.best}`);
                result.regionalSingleRecord = "NR";
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
      // Set WR average
      const [wrAverage] = await db
        .select({ average: table.average, continentId: table.continentId })
        .from(table)
        .where(
          and(
            isNull(table.competitionId),
            eq(table.eventId, result.eventId),
            eq(table.regionalAverageRecord, "WR"),
            lte(table.date, result.date),
          ),
        )
        .orderBy(desc(table.date))
        .limit(1);

      const isWrAverage = !wrAverage || compareAvgs(result, wrAverage) <= 0;
      if (isWrAverage) {
        console.log(`New ${result.eventId} average ${wrRecordConfig.label}: ${result.average}`);
        result.regionalAverageRecord = "WR";
      } else if (isSameContinentParticipants && firstParticipantContinent !== wrAverage?.continentId) {
        const crRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === continentalRecordType);
        if (crRecordConfig) {
          // Set CR average
          const [crAverage] = await db
            .select({ average: table.average, countryIso2: table.countryIso2 })
            .from(table)
            .where(
              and(
                isNull(table.competitionId),
                eq(table.eventId, result.eventId),
                eq(table.continentId, firstParticipantContinent),
                eq(table.regionalAverageRecord, continentalRecordType),
                lte(table.date, result.date),
              ),
            )
            .orderBy(desc(table.date))
            .limit(1);

          const isCrAverage = !crAverage || compareAvgs(result, crAverage) <= 0;
          if (isCrAverage) {
            console.log(`New ${result.eventId} average ${crRecordConfig.label}: ${result.average}`);
            result.regionalAverageRecord = continentalRecordType;
          } else if (isSameCountryParticipants && firstParticipantCountry !== crAverage?.countryIso2) {
            const nrRecordConfig = activeRecordConfigs.find((rc) => rc.recordTypeId === "NR");
            if (nrRecordConfig) {
              // Set NR average
              const [nrAverage] = await db
                .select({ average: table.average })
                .from(table)
                .where(
                  and(
                    isNull(table.competitionId),
                    eq(table.eventId, result.eventId),
                    eq(table.countryIso2, firstParticipantCountry),
                    eq(table.regionalAverageRecord, "NR"),
                    lte(table.date, result.date),
                  ),
                )
                .orderBy(desc(table.date))
                .limit(1);

              const isNrAverage = !nrAverage || compareAvgs(result, nrAverage) <= 0;
              if (isNrAverage) {
                console.log(`New ${result.eventId} average ${nrRecordConfig.label}: ${result.average}`);
                result.regionalAverageRecord = "NR";
              }
            }
          }
        }
      }
    }
  }
}

// async function updateFutureRecords(
//   result: ResultResponse,
//   event: SelectEvent,
//   recordPairs: IRecordPair[],
//   {
//     mode,
//     previousBest,
//     previousAvg,
//   }: {
//     mode: "create" | "delete";
//     previousBest?: undefined;
//     previousAvg?: undefined;
//   } | {
//     mode: "edit";
//     previousBest: number;
//     previousAvg: number;
//   },
// ) {
//   // for (const rp of recordPairs) {
//   // try {
//   const singlesComparison = mode === "edit" ? compareSingles(result, { best: previousBest }) : 0;
//   const singleGotWorse = singlesComparison > 0 || (mode === "delete" && result.best > 0);
//   const singleGotBetter = singlesComparison < 0 || (mode === "create" && result.best > 0);

//   if (singleGotWorse || singleGotBetter) {
//     const singleQuery = {
//       ...getBaseSinglesFilter(event),
//       _id: { $ne: (result as any)._id },
//       date: { $gte: result.date },
//     };

//     if (singleGotWorse) {
//       const best: any = { $gt: 0 };

//       // Make sure it's better than the record at the time, if there was one, and better than the new best, if it's an edit
//       if (rp.best > 0) best.$lte = rp.best;
//       if (mode === "edit" && compareSingles(result, { best: rp.best }) < 0) best.$lte = result.best;
//       singleQuery.best = best;

//       await this.recordTypesService.setEventSingleRecords(event, rp.wcaEquivalent, singleQuery);
//     } else {
//       // Remove single records cancelled by the new result or by the improved edited result
//       await this.resultModel
//         .updateMany({ ...singleQuery, best: { $gt: result.best } }, {
//           $unset: { regionalSingleRecord: "" },
//         });
//     }
//   }

//   const avgsComparison = mode === "edit" ? compareAvgs(result, { average: previousAvg }) : 0;
//   const avgGotWorse = avgsComparison > 0 || (mode === "delete" && result.average > 0);
//   const avgGotBetter = avgsComparison < 0 || (mode === "create" && result.average > 0);

//   if (avgGotWorse || avgGotBetter) {
//     const avgQuery = {
//       ...getBaseAvgsFilter(event),
//       _id: { $ne: (result as any)._id },
//       date: { $gte: result.date },
//     };

//     if (avgGotWorse) {
//       const average: any = { $gt: 0 };

//       // Make sure it's better than the record at the time, if there was one, and better than the new average, if it's an edit
//       if (rp.average > 0) average.$lte = rp.average;
//       if (mode === "edit" && compareAvgs(result, { average: rp.average }) < 0) average.$lte = result.average;
//       avgQuery.average = average;

//       await this.recordTypesService.setEventAvgRecords(event, rp.wcaEquivalent, avgQuery);
//     } else {
//       // Remove average records cancelled by the new result or by the improved edited result
//       await this.resultModel
//         .updateMany({ ...avgQuery, average: { $gt: result.average } }, {
//           $unset: { regionalAverageRecord: "" },
//         });
//     }
//     // }
//     // } catch (err) {
//     //   throw new InternalServerErrorException(
//     //     `Error while updating ${rp.wcaEquivalent} records after result update: ${err.message}`,
//     //   );
//     // }
//   }
// }
