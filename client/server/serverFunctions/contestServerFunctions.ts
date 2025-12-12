"use server";

import { endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { and, arrayContains, desc, eq, inArray } from "drizzle-orm";
import { find as findTimezone } from "geo-tz";
import z from "zod";
import { C } from "~/helpers/constants.ts";
import { getIsAdmin } from "~/helpers/utilityFunctions.ts";
import { type ContestDto, ContestValidator } from "~/helpers/validators/Contest.ts";
import { CoordinatesValidator } from "~/helpers/validators/Coordinates.ts";
import { type RoundDto, RoundValidator } from "~/helpers/validators/Round.ts";
import type { auth } from "~/server/auth.ts";
import { users as usersTable } from "~/server/db/schema/auth-schema.ts";
import { type PersonResponse, personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { roundsTable } from "~/server/db/schema/rounds.ts";
import { sendContestSubmittedNotification } from "~/server/email/mailer.ts";
import { db } from "../db/provider.ts";
import { type ContestResponse, contestsPublicCols, contestsTable as table } from "../db/schema/contests.ts";
import { actionClient, CcActionError } from "../safeAction.ts";

const getContestUrl = (competitionId: string) => `${process.env.BASE_URL}/competitions/${competitionId}`;

export const getModContestsSF = actionClient
  .metadata({ permissions: { modDashboard: ["view"] } })
  .inputSchema(
    z.strictObject({
      organizerPersonId: z.int().optional(),
    }),
  )
  .action<ContestResponse[]>(async ({ parsedInput: { organizerPersonId }, ctx: { session } }) => {
    const queryFilters = [];

    // If it's a moderator, only get their own contests
    if (!getIsAdmin(session.user.role)) {
      const msg = "Your competitor profile must be tied to your account before you can use moderator features";
      if (!session.user.personId) throw new CcActionError(msg);

      const [userPerson] = await db
        .select({ id: personsTable.id })
        .from(personsTable)
        .where(eq(personsTable.personId, session.user.personId));

      if (!userPerson) throw new CcActionError(msg);
      queryFilters.push(arrayContains(table.organizers, [userPerson.id]));
    }

    if (organizerPersonId) {
      const [organizerPerson] = await db
        .select({ id: personsTable.id })
        .from(personsTable)
        .where(eq(personsTable.personId, organizerPersonId));

      if (!organizerPerson) throw new CcActionError(`Person with ID ${organizerPersonId} not found`);
      queryFilters.push(arrayContains(table.organizers, [organizerPerson.id]));
    }

    const contests = await db
      .select(contestsPublicCols)
      .from(table)
      .where(and(...queryFilters))
      .orderBy(desc(table.startDate));

    return contests;
  });

// This assumes that if you can create meetups, you can also create competitions
export const getTimeZoneFromCoordsSF = actionClient
  .metadata({ permissions: { meetups: ["create"] } })
  .inputSchema(CoordinatesValidator)
  .action<string>(async ({ parsedInput: { latitude, longitude } }) => {
    const timeZone = findTimezone(latitude, longitude).at(0);

    if (!timeZone)
      throw new CcActionError(`Time zone for coordinates ${latitude}, ${longitude} not found`, {
        data: { timeZoneNotFound: true },
      });

    return timeZone;
  });

export const createContestSF = actionClient
  .metadata({ permissions: { meetups: ["create"] } })
  .inputSchema(
    z.strictObject({
      newContestDto: ContestValidator,
      rounds: z.array(RoundValidator).nonempty({ error: "Please select at least one event" }),
    }),
  )
  .action(async ({ parsedInput: { newContestDto, rounds }, ctx: { session } }) => {
    // No need to check that the state is not removed, because removed contests have _REMOVED at the end of the competitionId anyways
    const sameIdContest = await db.query.contests.findFirst({ where: { competitionId: newContestDto.competitionId } });
    if (sameIdContest) throw new CcActionError(`A contest with the ID ${newContestDto.competitionId} already exists`);
    const sameNameContest = await db.query.contests.findFirst({
      where: { name: newContestDto.name, state: { NOT: "removed" } },
    });
    if (sameNameContest) throw new CcActionError(`A contest with the name ${newContestDto.name} already exists`);
    const sameShortContest = await db.query.contests.findFirst({
      where: { shortName: newContestDto.shortName, state: { NOT: "removed" } },
    });
    if (sameShortContest)
      throw new CcActionError(`A contest with the short name ${newContestDto.shortName} already exists`);

    const { organizers } = await validateAndCleanUpContest(newContestDto, rounds, session.user);
    const organizerUsers = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(
        inArray(
          usersTable.personId,
          organizers.map((o) => o.personId),
        ),
      );

    await db.transaction(async (tx) => {
      await tx
        .insert(roundsTable)
        .values(
          rounds.map((r) =>
            r.roundNumber === 1 ? { ...r, id: undefined, open: true } : { ...r, id: undefined, open: false },
          ),
        );

      const [createdContest] = await tx
        .insert(table)
        .values({ ...newContestDto, createdBy: session.user.id })
        .returning();

      // Email the creator and admins
      sendContestSubmittedNotification(
        organizerUsers.map((u) => u.email),
        createdContest,
        getContestUrl(newContestDto.competitionId),
        organizers.find((o) => o.personId === session.user.personId)?.name ?? "UNKNOWN",
      );
    });
  });

async function validateAndCleanUpContest(
  contest: ContestDto,
  rounds: RoundDto[],
  user: typeof auth.$Infer.Session.user,
): Promise<{ organizers: PersonResponse[] }> {
  const isAdmin = getIsAdmin(user.role);
  const events = await db.query.events.findMany();

  // Protect against admin-only stuff
  if (!isAdmin) {
    // WON'T WORK UNTIL PERSON IDS ARE MIGRATED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (!contest.organizers.some((id) => id === user.personId))
      throw new CcActionError("You cannot create a contest which you are not organizing");
  }

  const roundIds = new Set<string>();

  for (const round of rounds) {
    const roundId = `${round.eventId}-r${round.roundNumber}`;
    if (roundIds.has(roundId)) throw new CcActionError(`Duplicate round found: ${roundId}`);
    roundIds.add(roundId); // also used below in schedule validation

    if (round.competitionId !== contest.competitionId)
      throw new CcActionError("A round may not have a competition ID different from the contest's competition ID");

    const event = events.find((e) => e.eventId === round.eventId);
    if (!event) throw new CcActionError(`Event with ID ${round.eventId} not found`);
    if (event.category === "removed") throw new CcActionError("Removed events are not allowed");

    if (event.format === "time" && (!round.timeLimitCentiseconds || !round.timeLimitCumulativeRoundIds))
      throw new CcActionError("Every round of an event with the format Time must have a time limit");

    if (
      event.format !== "time" &&
      (round.timeLimitCentiseconds ||
        round.timeLimitCumulativeRoundIds ||
        round.cutoffAttemptResult ||
        round.cutoffNumberOfAttempts)
    )
      throw new CcActionError("A round of an event with the format Time cannot have a time limit or cutoff");
  }

  // Make sure all organizer IDs are valid
  const organizers = await db
    .select(personsPublicCols)
    .from(personsTable)
    .where(inArray(personsTable.id, contest.organizers));
  if (organizers.length !== contest.organizers.length)
    throw new CcActionError("One of the organizer persons was not found");

  // Validation of meetups
  if (contest.type === "meetup") {
    if (rounds.length > C.maxTotalMeetupRounds)
      throw new CcActionError("You may not hold more than 15 rounds at a meetup");

    const correctTZ = findTimezone(contest.latitudeMicrodegrees / 1000000, contest.longitudeMicrodegrees / 1000000)[0];
    if (contest.timeZone !== correctTZ)
      throw new CcActionError("Contest time zone doesn't match time zone at the given coordinates");
  }
  // Validation of WCA competitions and unofficial competitions
  else {
    for (const round of rounds) {
      const event = events.find((e) => e.eventId === round.eventId)!;
      if (contest.type === "wca-comp" && event.category === "wca") {
        throw new CcActionError(
          "WCA events may not be added for the WCA Competition contest type. They must be held through the WCA website only.",
        );
      }

      let isRoundActivityFound = false;
      for (const venue of contest.schedule!.venues) {
        isRoundActivityFound = venue.rooms.some((r) =>
          r.activities.some((a) => a.activityCode === `${round.eventId}-r${round.roundNumber}`),
        );
        if (isRoundActivityFound) break;
      }
      if (!isRoundActivityFound) throw new CcActionError("Please add all rounds to the schedule");
    }

    // Schedule validation
    for (const venue of contest.schedule!.venues) {
      if (venue.countryIso2 !== contest.countryIso2)
        throw new CcActionError("A venue may not have a country different from the contest country");
      if (
        venue.latitudeMicrodegrees !== contest.latitudeMicrodegrees ||
        venue.longitudeMicrodegrees !== contest.longitudeMicrodegrees
      )
        throw new CcActionError("The schedule may not have coordinates different from the contest coordinates");

      const correctTZ = findTimezone(venue.latitudeMicrodegrees / 1000000, venue.longitudeMicrodegrees / 1000000)[0];
      if (venue.timezone !== correctTZ)
        throw new CcActionError("Venue time zone doesn't match time zone at the given coordinates");

      for (const room of venue.rooms) {
        for (const activity of room.activities) {
          if (!/^other-/.test(activity.activityCode) && !roundIds.has(activity.activityCode))
            throw new CcActionError(`Activity ${activity.activityCode} does not have a corresponding round`);

          const zonedStartTime = toZonedTime(activity.startTime, venue.timezone).getTime();
          if (zonedStartTime < contest.startDate.getTime())
            throw new CcActionError("An activity may not start before the start date");
          const zonedEndTime = toZonedTime(activity.endTime, venue.timezone).getTime();
          if (zonedEndTime > endOfDay(contest.endDate).getTime())
            throw new CcActionError("An activity may not end after the end date");
          if (zonedStartTime >= zonedEndTime)
            throw new CcActionError("An activity start time may not be after or at the same time as the end time");
        }
      }
    }
  }

  return { organizers };
}
