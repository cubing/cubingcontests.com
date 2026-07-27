"use server";

import { differenceInDays } from "date-fns";
import { eq } from "drizzle-orm";
import z from "zod";
import { C } from "~/helpers/constants.ts";
import { roundFormats, videoBasedFormats } from "~/helpers/roundFormats.ts";
import { type EventWrPair, RecordCategoryValues } from "~/helpers/types.ts";
import { getBestAndAverage, getHasRole, getMemberControlsContest } from "~/helpers/utility-functions.ts";
import { AttemptsValidator, ResultValidator, VideoBasedResultValidator } from "~/helpers/validators/Result.ts";
import { auth } from "~/server/auth.ts";
import { contestsTable } from "~/server/db/schema/contests.ts";
import { getContestEventResults, getContestParticipantIds } from "~/server/server-only-functions/contests-functions.ts";
import {
  cancelFutureRecords,
  createContestResult,
  getNotProceededParticipant,
  getRecordResult,
  setFutureRecords,
  setRankingAndProceedsValues,
  setResultRecords,
  setResultRecordsAndRegions,
  updateContestResult,
  validateContestResult,
} from "~/server/server-only-functions/results-functions.ts";
import { approvePersons, getRecordConfigs, logMessage } from "~/server/server-only-functions/server-only-functions.ts";
import { db } from "../db/provider.ts";
import {
  type InsertResult,
  type ResultResponse,
  resultsPublicCols,
  type SelectResult,
  resultsTable as table,
} from "../db/schema/results.ts";
import { sendVideoBasedResultApprovedEmail, sendVideoBasedResultSubmittedEmail } from "../email/mailer.ts";
import { actionClient, RrActionError } from "../safe-action.ts";

export const getWrPairUpToDateSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { videoBasedResults: ["create"] } } })
  .inputSchema(
    z.strictObject({
      recordCategory: z.enum(RecordCategoryValues),
      eventId: z.string(),
      recordsUpTo: z.date(),
      excludeResultId: z.int().optional(),
    }),
  )
  .action<EventWrPair>(
    async ({ parsedInput: { recordCategory, eventId, recordsUpTo, excludeResultId }, ctx: { session } }) => {
      const event = await db.query.events.findFirst({ where: { organizationId: session.organization!.id, eventId } });
      if (!event) throw new RrActionError(`Event with ID ${eventId} not found`);

      const singleWrResult = await getRecordResult(event, "best", "WR", recordCategory, {
        recordsUpTo,
        excludeResultId,
      });
      const averageWrResult = await getRecordResult(event, "average", "WR", recordCategory, {
        recordsUpTo,
        excludeResultId,
      });

      return { eventId, best: singleWrResult?.best, average: averageWrResult?.average };
    },
  );

export const createContestResultSF = actionClient
  // Permissions checked below
  .metadata({ auth: { useOrganization: true } })
  .inputSchema(
    z.strictObject({
      newResultDto: ResultValidator,
    }),
  )
  .action<ResultResponse[]>(async ({ parsedInput: { newResultDto }, ctx: { session, httpHeaders } }) => {
    const { eventId, personIds, competitionId, roundId } = newResultDto;
    const organizationId = session.organization!.id;
    logMessage(
      "RR0013",
      `Creating contest result for contest ${competitionId}, event ${eventId}, round ${roundId} and persons ${personIds.join(", ")}: ${JSON.stringify(newResultDto.attempts)}`,
    );

    const [
      { success: canCreateAndUpdateContests },
      { success: canSubmitOwnOnlineCompResult },
      contest,
      event,
      rounds,
      roundResults,
      participants,
    ] = await Promise.all([
      auth.api.hasPermission({
        headers: httpHeaders,
        body: { permissions: { competitions: ["create", "update"], meetups: ["create", "update"] } },
      }),
      auth.api.hasPermission({ headers: httpHeaders, body: { permissions: { onlineComps: ["submit-own-result"] } } }),
      db.query.contests.findFirst({ where: { organizationId, competitionId } }),
      db.query.events.findFirst({ where: { organizationId, eventId } }),
      db.query.rounds.findMany({ where: { organizationId, competitionId, eventId } }),
      db.query.results.findMany({ where: { organizationId, roundId }, orderBy: { ranking: "asc" } }),
      db.query.persons.findMany({ where: { organizationId, id: { in: personIds } } }),
    ]);
    const round = rounds.find((r) => r.id === roundId);

    if (!contest) throw new RrActionError(`Contest with ID ${competitionId} not found`);
    // This is similar to the logic in the contest controls component
    const userControlsContest = canCreateAndUpdateContests && getMemberControlsContest(session.member!, contest);
    const hasAccessToResults = canSubmitOwnOnlineCompResult && contest.type === "online" && session.member!.personId;
    if (!userControlsContest && !hasAccessToResults)
      throw new RrActionError("You are unauthorized to submit results for this contest");
    if (!userControlsContest && hasAccessToResults && !personIds.includes(session.member!.personId as any))
      throw new RrActionError("You can only submit your own result");
    if (!event) throw new RrActionError("Event not found");
    if (!round) throw new RrActionError("Round not found");
    if (!round.open) throw new RrActionError("The round is not open");
    // Same check as in createVideoBasedResultSF
    const notFoundPersonId = personIds.find((pid) => !participants.some((p) => p.id === pid));
    if (notFoundPersonId) throw new RrActionError(`Person with ID ${notFoundPersonId} not found`);
    if (roundResults.some((r) => r.personIds.some((pid) => newResultDto.personIds.includes(pid))))
      throw new RrActionError("The competitor(s) already has a result in this round");
    const { notProceededParticipantIndex } = await getNotProceededParticipant({
      personIds: newResultDto.personIds,
      roundNumber: round.roundNumber,
      rounds,
    });
    if (notProceededParticipantIndex !== null) {
      throw new RrActionError(
        `Competitor${event.participants > 1 ? ` ${notProceededParticipantIndex + 1}` : ""} has not proceeded to this round`,
      );
    }

    const roundFormat = roundFormats.find((rf) => rf.value === round.format)!;
    const isAdmin = getHasRole("admin", session.member!.role) || getHasRole("owner", session.member!.role);

    newResultDto.attempts = await validateContestResult({
      organizationId,
      attempts: newResultDto.attempts,
      personIds: newResultDto.personIds,
      round,
      event,
      expectedNumberOfAttempts: roundFormat.attempts,
    });

    await createContestResult({
      personIds,
      attempts: newResultDto.attempts,
      createdBy: session.user.id,
      participants,
      roundResults,
      round,
      event,
      contest,
      isAdmin,
    });

    return await getContestEventResults({ organizationId, competitionId, eventId });
  });

export const updateContestResultSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { competitions: ["create"], meetups: ["create"] } } })
  .inputSchema(
    z.strictObject({
      id: z.int(),
      newAttempts: AttemptsValidator,
    }),
  )
  .action<ResultResponse[]>(async ({ parsedInput: { id, newAttempts }, ctx: { session } }) => {
    const organizationId = session.organization!.id;
    const result = await db.query.results.findFirst({
      where: { organizationId, id, competitionId: { isNotNull: true } },
    });
    if (!result) throw new RrActionError(`Result with ID ${id} not found`);

    logMessage("RR0014", `Updating result with ID ${id} (new attempts: ${JSON.stringify(newAttempts)})`);

    const [contest, event, round, roundResults] = await Promise.all([
      db.query.contests.findFirst({ where: { organizationId, competitionId: result.competitionId! } }),
      db.query.events.findFirst({ where: { organizationId, eventId: result.eventId } }),
      db.query.rounds.findFirst({ where: { organizationId, id: result.roundId! } }),
      db.query.results.findMany({ where: { organizationId, roundId: result.roundId! }, orderBy: { ranking: "asc" } }),
    ]);

    if (!contest) throw new RrActionError(`Contest with ID ${result.competitionId} not found`);
    if (!getMemberControlsContest(session.member!, contest))
      throw new RrActionError("You do not have access rights for this contest");
    if (!event) throw new RrActionError(`Event with ID ${result.eventId} not found`);
    if (!round) throw new RrActionError(`Round with ID ${result.roundId} not found`);

    const roundFormat = roundFormats.find((rf) => rf.value === round.format)!;
    const isAdmin = getHasRole("admin", session.member!.role) || getHasRole("owner", session.member!.role);

    newAttempts = await validateContestResult({
      organizationId,
      attempts: newAttempts,
      personIds: result.personIds,
      round,
      event,
      expectedNumberOfAttempts: roundFormat.attempts,
    });

    await updateContestResult({ prevResult: result, newAttempts, roundResults, round, event, contest, isAdmin });

    return await getContestEventResults({
      organizationId,
      competitionId: result.competitionId!,
      eventId: result.eventId,
    });
  });

export const deleteContestResultSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { competitions: ["create"], meetups: ["create"] } } })
  .inputSchema(
    z.strictObject({
      id: z.int(),
    }),
  )
  .action<ResultResponse[]>(async ({ parsedInput: { id }, ctx: { session } }) => {
    const organizationId = session.organization!.id;
    const result = await db.query.results.findFirst({
      where: { organizationId, id, competitionId: { isNotNull: true } },
    });
    if (!result) throw new RrActionError(`Result with ID ${id} not found`);

    const isAdmin = getHasRole("admin", session.member!.role) || getHasRole("owner", session.member!.role);

    if (
      !process.env.VITEST &&
      !isAdmin &&
      (result.regionalSingleRecord || result.regionalAverageRecord) &&
      differenceInDays(new Date(), result.date) > 30
    ) {
      throw new RrActionError(C.message.oldResultWithRecordValidationError);
    }

    logMessage("RR0015", `Deleting contest result: ${JSON.stringify(result)}`);

    const [contest, event, round, roundResults] = await Promise.all([
      db.query.contests.findFirst({ where: { organizationId, competitionId: result.competitionId! } }),
      db.query.events.findFirst({ where: { organizationId, eventId: result.eventId } }),
      db.query.rounds.findFirst({ where: { organizationId, id: result.roundId! } }),
      db.query.results.findMany({ where: { organizationId, roundId: result.roundId! }, orderBy: { ranking: "asc" } }),
    ]);

    if (!contest) throw new RrActionError(`Contest with ID ${result.competitionId} not found`);
    if (!getMemberControlsContest(session.member!, contest))
      throw new RrActionError("You do not have access rights for this contest");
    if (!event) throw new RrActionError(`Event with ID ${result.eventId} not found`);
    if (!round) throw new RrActionError(`Round with ID ${result.roundId} not found`);

    const recordConfigs = await getRecordConfigs(organizationId, { contestType: contest.type });

    await db.transaction(async (tx) => {
      await tx.delete(table).where(eq(table.id, id));

      await setRankingAndProceedsValues(
        tx,
        roundResults.filter((r) => r.id !== id),
        round,
      );

      // Set records that may have been prevented by the deleted result
      if (result.regionalSingleRecord) await setFutureRecords(tx, result, event, "best", recordConfigs);
      if (result.regionalAverageRecord) await setFutureRecords(tx, result, event, "average", recordConfigs);

      const participantIds = await getContestParticipantIds({
        tx,
        organizationId,
        competitionId: result.competitionId!,
      });
      if (participantIds.length !== contest.participants) {
        await tx
          .update(contestsTable)
          .set({ participants: participantIds.length })
          .where(eq(contestsTable.id, contest.id));
      }
    });

    return await getContestEventResults({
      organizationId,
      competitionId: result.competitionId!,
      eventId: result.eventId,
    });
  });

export const createVideoBasedResultSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { videoBasedResults: ["create"] } } })
  .inputSchema(
    z.strictObject({
      newResultDto: VideoBasedResultValidator,
    }),
  )
  .action<ResultResponse>(async ({ parsedInput: { newResultDto }, ctx: { session, httpHeaders } }) => {
    logMessage("RR0016", `Creating video-based result: ${JSON.stringify(newResultDto)}`);

    const organizationId = session.organization!.id;
    const { success: canApprove } = await auth.api.hasPermission({
      headers: httpHeaders,
      body: { permissions: { videoBasedResults: ["approve"] } },
    });

    if (!canApprove) {
      if (!newResultDto.videoLink) throw new RrActionError("Please enter a video link");
      if (newResultDto.attempts.some((a) => a.result === C.maxTime))
        throw new RrActionError("You are not authorized to set unknown time");
    }

    const [event, participants, recordConfigs, creatorPerson] = await Promise.all([
      db.query.events.findFirst({ where: { organizationId, eventId: newResultDto.eventId } }),
      db.query.persons.findMany({ where: { organizationId, id: { in: newResultDto.personIds } } }),
      getRecordConfigs(organizationId, { recordCategory: "online" }),
      session.member!.personId
        ? db.query.persons.findFirst({
            columns: { name: true },
            where: { organizationId, id: session.member!.personId },
          })
        : undefined,
    ]);

    if (!event) throw new RrActionError(`Event with ID ${newResultDto.eventId} not found`);
    // Same check as in createContestResultSF
    const notFoundPersonId = newResultDto.personIds.find((pid) => !participants.some((p) => p.id === pid));
    if (notFoundPersonId) throw new RrActionError(`Person with ID ${notFoundPersonId} not found`);
    // Same check as in validateResult()
    if (newResultDto.personIds.length !== event.participants) {
      throw new RrActionError(
        `This event must have ${event.participants} participant${event.participants > 1 ? "s" : ""}`,
      );
    }

    const roundFormat = videoBasedFormats.find((rf) => rf.attempts === newResultDto.attempts.length)!;
    const { best, average } = getBestAndAverage(newResultDto.attempts, event.format, roundFormat.value);
    const newResult: InsertResult = {
      ...newResultDto,
      organizationId,
      best,
      average,
      recordCategory: "online",
      createdBy: session.user.id,
    };

    await setResultRecordsAndRegions(newResult, event, recordConfigs, participants);

    const [createdResult] = await db.insert(table).values(newResult).returning(resultsPublicCols);

    sendVideoBasedResultSubmittedEmail(session.user.email, {
      event,
      result: createdResult,
      creatorName: session.user.name,
      creatorPersonName: creatorPerson?.name,
      organization: session.organization!,
    });

    return createdResult;
  });

export const updateVideoBasedResultSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { videoBasedResults: ["update", "approve"] } } })
  .inputSchema(
    z.strictObject({
      id: z.int(),
      newResultDto: VideoBasedResultValidator.pick({
        date: true,
        attempts: true,
        videoLink: true,
        discussionLink: true,
      }),
      approve: z.boolean(),
    }),
  )
  .action<ResultResponse>(async ({ parsedInput: { id, newResultDto, approve }, ctx: { session } }) => {
    const organizationId = session.organization!.id;
    const result = await db.query.results.findFirst({
      with: { creator: { columns: { email: true } } },
      where: { organizationId, id, competitionId: { isNull: true } },
    });
    if (!result) throw new RrActionError(`Result with ID ${id} not found`);
    if (result.approved)
      throw new RrActionError("Editing approved results is currently not supported. Please contact a sysadmin.");

    logMessage("RR0017", `Updating video-based result with ID ${id}: ${JSON.stringify(newResultDto)}`);

    const [event, recordConfigs] = await Promise.all([
      db.query.events.findFirst({ where: { organizationId, eventId: result.eventId } }),
      getRecordConfigs(organizationId, { recordCategory: "online" }),
    ]);

    if (!event) throw new RrActionError(`Event with ID ${result.eventId} not found`);
    if (newResultDto.attempts.length !== result.attempts.length)
      throw new RrActionError("The number of attempts cannot be changed");

    const roundFormat = videoBasedFormats.find((rf) => rf.attempts === newResultDto.attempts.length)!;
    const { best, average } = getBestAndAverage(newResultDto.attempts, event.format, roundFormat.value);
    const newResult: SelectResult = {
      ...result,
      date: newResultDto.date,
      approved: approve,
      attempts: newResultDto.attempts,
      best,
      average,
      regionalSingleRecord: null,
      regionalAverageRecord: null,
      videoLink: newResultDto.videoLink,
      discussionLink: newResultDto.discussionLink,
    };

    await setResultRecords(newResult, event, recordConfigs, { excludeResultId: id });

    const updatedResult = await db.transaction(async (tx) => {
      const [updatedResult] = await tx
        .update(table)
        .set({
          date: newResult.date,
          approved: newResult.approved,
          attempts: newResult.attempts,
          best: newResult.best,
          average: newResult.average,
          regionalSingleRecord: newResult.regionalSingleRecord,
          regionalAverageRecord: newResult.regionalAverageRecord,
          videoLink: newResult.videoLink,
          discussionLink: newResult.discussionLink,
        })
        .where(eq(table.id, id))
        .returning();

      if (approve) {
        if (updatedResult.regionalSingleRecord)
          await cancelFutureRecords(tx, organizationId, updatedResult, "best", recordConfigs);
        if (updatedResult.regionalAverageRecord)
          await cancelFutureRecords(tx, organizationId, updatedResult, "average", recordConfigs);

        const personsToBeApproved = await tx.query.persons.findMany({
          where: { organizationId, id: { in: result.personIds }, approved: false },
        });
        await approvePersons(tx, organizationId, personsToBeApproved);

        if (result.creator)
          sendVideoBasedResultApprovedEmail(result.creator.email, { event, organization: session.organization! });
      }

      return updatedResult;
    });

    return updatedResult;
  });
