import type { NextRequest } from "next/server";
import { IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import type { ContestApiKeyMetadata } from "~/helpers/types.ts";
import { arrayElementsSame } from "~/helpers/utility-functions.ts";
import { EnterAttemptPayloadValidator } from "~/helpers/validators/EnterAttemptPayload.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { Attempt } from "~/server/db/schema/results.ts";
import {
  createContestResult,
  getNotProceededParticipant,
  updateContestResult,
  validateContestResult,
} from "~/server/server-only-functions/results-functions.ts";
import { getOrgSubscription, getPersonsForExternalDeviceDataEntry } from "~/server/server-only-functions.ts";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (!key) return new Response("Unauthorized", { status: 401 });
  const parsed = EnterAttemptPayloadValidator.safeParse(await req.json());
  if (!parsed.success) return new Response(`Validation error: ${parsed.error}`, { status: 400 });
  const { spaceId, competitionId, eventId, roundNumber, attemptNumber, attemptResult } = parsed.data;

  const organization = await db.query.organizations.findFirst({
    columns: { id: true },
    with: { subscription: { columns: { plan: true }, where: { status: { in: ["active", "trialing"] } } } },
    where: { slug: spaceId },
  });
  if (!organization) return new Response("Space not found", { status: 404 });
  if (IS_RR_INSTANCE && !organization.subscription)
    return new Response("There is no active subscription for this space", { status: 400 });

  const [verification, contest, event, rounds] = await Promise.all([
    auth.api.verifyApiKey({
      body: {
        configId: "contest_keys",
        key,
        permissions: { competitions: ["update"], meetups: ["update"] },
      },
    }),
    db.query.contests.findFirst({
      where: { organizationId: organization.id, competitionId, state: { ne: "removed" } },
    }),
    db.query.events.findFirst({ where: { organizationId: organization.id, eventId } }),
    db.query.rounds.findMany({ where: { organizationId: organization.id, competitionId, eventId } }),
  ]);
  const round = rounds.find((r) => r.roundNumber === roundNumber);

  if (
    !verification.valid ||
    !verification.key ||
    (verification.key.metadata as ContestApiKeyMetadata).organizationId !== organization.id ||
    (verification.key.metadata as ContestApiKeyMetadata).competitionId !== competitionId
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!contest) return new Response(`Contest with ID ${competitionId} not found`, { status: 400 });
  if (contest.state === "created") return new Response("This contest hasn't been approved yet", { status: 400 });
  if (!["approved", "ongoing"].includes(contest.state))
    return new Response("This contest has already been finished", { status: 400 });
  if (!event) return new Response("Event not found", { status: 400 });
  if (event.format !== "time") {
    return new Response("External data entry is currently only supported for events with the time format", {
      status: 501,
    });
  }
  if (!round) return new Response("Round not found", { status: 400 });
  if (!round.open) return new Response("The round is not open", { status: 400 });

  const participants: PersonResponse[] = [];
  try {
    participants.push(
      ...(await getPersonsForExternalDeviceDataEntry(parsed.data, {
        creatorUserId: verification.key.referenceId,
        organization: { id: organization.id, subscription: getOrgSubscription(organization.subscription) },
      })),
    );
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
  const personIds = participants.map((p) => p.id);
  const { notProceededParticipantIndex } = await getNotProceededParticipant({ personIds, roundNumber, rounds });
  if (notProceededParticipantIndex !== null) {
    return new Response(
      `Competitor${event.participants > 1 ? ` ${notProceededParticipantIndex + 1}` : ""} has not proceeded to this round`,
      { status: 400 },
    );
  }

  const roundResults = await db.query.results.findMany({ where: { roundId: round.id } });
  const result = roundResults.find((r) => arrayElementsSame(r.personIds, personIds));
  const roundFormat = roundFormats.find((rf) => rf.value === round.format)!;
  let attempts: Attempt[] = [];
  for (let i = 0; i < roundFormat.attempts; i++) {
    if (i === attemptNumber - 1) attempts.push({ result: attemptResult });
    else if (result?.attempts[i]) attempts.push(result.attempts[i]);
    else attempts.push({ result: 0 });
  }

  try {
    attempts = await validateContestResult({
      organizationId: organization.id,
      attempts,
      personIds,
      round,
      event,
      expectedNumberOfAttempts: roundFormat.attempts,
    });

    if (result) {
      await updateContestResult({ prevResult: result, newAttempts: attempts, roundResults, round, event, contest });
    } else {
      await createContestResult({
        personIds,
        attempts,
        createdBy: verification.key.referenceId,
        roundResults,
        participants,
        round,
        event,
        contest,
      });
    }
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }

  return new Response("Successfully entered attempt", { status: 200 });
}
