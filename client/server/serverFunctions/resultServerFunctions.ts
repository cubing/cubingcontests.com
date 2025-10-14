"use server";

import z from "zod";
import { actionClient, CcActionError } from "../safeAction.ts";
import { EventWrPair } from "~/helpers/types.ts";
import { getWrPairs } from "../serverUtilityFunctions.ts";
import { VideoBasedResultValidator } from "~/helpers/validators/Result.ts";
import { ResultResponse, resultsPublicCols, resultsTable as table } from "../db/schema/results.ts";
import { C } from "~/helpers/constants.ts";
import { eventsTable } from "../db/schema/events.ts";
import { db } from "../db/provider.ts";
import { eq } from "drizzle-orm";
import { getBestAndAverage } from "~/helpers/sharedFunctions.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";

export const getWrPairsUpToDateSF = actionClient.metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(z.strictObject({
    recordsUpTo: z.date(),
    excludeResultId: z.int().optional(),
  })).action<EventWrPair[]>(async ({ parsedInput: { recordsUpTo, excludeResultId } }) => {
    return await getWrPairs({ recordsUpTo, excludeResultId });
  });

export const createVideoBasedResultSF = actionClient.metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(z.strictObject({
    newResult: VideoBasedResultValidator,
  })).action<ResultResponse>(async ({ parsedInput: { newResult }, ctx: { session } }) => {
    console.log(`Creating new video-based result: ${JSON.stringify(newResult)}`);

    const isAdmin = session.user.role === "admin";

    // Disallow admin-only features
    if (!isAdmin) {
      if (newResult.videoLink === "") throw new CcActionError("Please enter a video link");
      if (newResult.attempts.some((a) => a.result === C.maxTime)) {
        throw new CcActionError("You are not authorized to set unknown time");
      }
    }

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.eventId, newResult.eventId)).limit(1);

    if (newResult.personIds.length !== event.participants) {
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

    const format = roundFormats.find((rf) => rf.attempts === newResult.attempts.length && rf.value !== "3")!;
    const { best, average } = getBestAndAverage(newResult.attempts, event, format.value);
    const [createdResult] = await db.insert(table).values({ ...newResult, best, average, createdBy: session.user.id })
      .returning(resultsPublicCols) as ResultResponse[];

    // TO-DO: RECORD SETTING LOGIC!

    // The best and average get set in validateAndCleanUpResult
    // const newResult: IVideoBasedResult = {
    //   ...createResultDto,
    //   unapproved: isAdmin ? undefined : true,
    //   date: new Date(createResultDto.date),
    //   best: 0,
    //   average: 0,
    //   createdBy: new mongo.ObjectId(user._id as string),
    // };
    // await this.validateAndCleanUpResult(newResult, event, { mode: "submit" });
    // const recordPairs = await this.getEventRecordPairs(event, {
    //   recordsUpTo: createResultDto.date,
    // });
    // const createdResult = await this.resultModel.create(setResultRecords(newResult, event, recordPairs, !isAdmin));

    // if (isAdmin) {
    //   await this.personsService.approvePersons({
    //     personIds: createdResult.personIds,
    //   });

    //   await this.updateFutureRecords(createdResult, event, recordPairs, {
    //     mode: "create",
    //   });
    // } else {
    //   await this.emailService.sendVideoBasedResultSubmittedNotification(
    //     user.email,
    //     event,
    //     createdResult as IVideoBasedResult,
    //     user.username,
    //   );
    // }

    return createdResult;
  });
