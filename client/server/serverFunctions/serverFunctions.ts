"use server";

import { find as findTimezone } from "geo-tz";
import { db } from "~/server/db/provider.ts";
import {
  CollectiveSolutionResponse,
  collectiveSolutionsPublicCols,
  collectiveSolutionsTable as csTable,
} from "~/server/db/schema/collective-solutions.ts";
import { and, eq, ne } from "drizzle-orm";
import { randomScrambleForEvent } from "cubing/scramble";
import { cube2x2x2 } from "cubing/puzzles";
import { Alg } from "cubing/alg";
import { nxnMoves } from "~/helpers/types/NxNMove.ts";
import { z } from "zod/v4";
import { actionClient, CcActionError } from "../safeAction.ts";
import { auth } from "~/server/auth.ts";
import { Roles } from "~/server/permissions.ts";
import { headers } from "next/headers";
import { usersTable } from "~/server/db/schema/auth-schema.ts";
import { PersonResponse, personsPublicCols, personsTable } from "../db/schema/persons.ts";
import { approvePersonSF } from "./personServerFunctions.ts";
import { sendEmail, sendRoleChangedEmail } from "~/server/mailer.ts";
import { C } from "~/helpers/constants.ts";

// const CoordinatesValidator = z.strictObject({
//   latitude: z.number().gte(-90).lte(90),
//   longitude: z.number().gte(-180).lte(180),
// });

// export async function getTimeZoneFromCoordsSF(
//   dto: { latitude: NumberInputValue; longitude: NumberInputValue },
// ): Promise<FetchObj<string>> {
//   const parsed = CoordinatesValidator.safeParse(dto);
//   if (!parsed.success) return getValidationError(parsed.error);
//   const { data: { latitude, longitude } } = parsed;

//   const timeZone = findTimezone(latitude, longitude).at(0);

//   if (!timeZone) return { success: false, error: { code: "NOT_FOUND" } };

//   return await Promise.resolve({ success: true, data: timeZone });
// }

export const updateUserSF = actionClient.metadata({ permissions: { user: ["set-role"] } })
  .inputSchema(z.strictObject({
    id: z.string(),
    personId: z.int().nullable().default(null),
    role: z.enum(Roles),
  })).action<{ user: typeof auth.$Infer.Session.user; person?: PersonResponse }>(
    async ({ parsedInput: { id, personId, role } }) => {
      const hdrs = await headers();

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      if (!user) throw new CcActionError("User not found");
      if (!user.emailVerified) throw new CcActionError("This user hasn't verified their email address yet");

      let person: PersonResponse | undefined;
      if (personId) {
        if (personId !== user.personId) {
          const [samePersonUser] = await db.select({ id: usersTable.id }).from(usersTable)
            .where(and(ne(usersTable.id, id), eq(usersTable.personId, personId))).limit(1);
          if (samePersonUser) throw new CcActionError("The selected person is already tied to another user");

          person = (await db.select(personsPublicCols).from(personsTable)
            .where(eq(personsTable.personId, personId)).limit(1)).at(0);
          if (!person) throw new CcActionError(`Person with ID ${personId} not found`);

          if (!person.approved) await approvePersonSF({ id: personId, approveByPersonId: true });
        }
      } else if (role !== "user") {
        throw new CcActionError("Privileged users must have a person tied to their account");
      }

      if (user.role !== role) {
        await auth.api.setRole({ body: { userId: id, role }, headers: hdrs });

        if (role === "admin") {
          await sendEmail(
            C.contactEmail,
            "New admin user",
            `<h1>New admin user</h1>
            <p>User ${user.username}${person ? ` (${person.name})` : ""} has been given the admin role.</p>`,
          );
        }

        await sendRoleChangedEmail(user.email, role);
      }

      const [updatedUser] = await db.update(usersTable).set({ personId }).where(eq(usersTable.id, id)).returning();

      await auth.api.revokeUserSessions({ body: { userId: id }, headers: hdrs });

      return { user: updatedUser, person };
    },
  );

export const startNewCollectiveCubingSolutionSF = actionClient.metadata({ permissions: null })
  .action<CollectiveSolutionResponse>(async ({ ctx: { session } }) => {
    const [ongoingSolution] = await db.select().from(csTable).where(eq(csTable.state, "ongoing")).limit(1);

    if (ongoingSolution) throw new CcActionError("The cube has already been scrambled", { data: ongoingSolution });

    const eventId = "222";
    const scramble = await randomScrambleForEvent(eventId);

    const [newSolution] = await db.transaction(async (tx) => {
      await tx.update(csTable).set({ state: "archived" }).where(eq(csTable.state, "solved"));
      return await tx.insert(csTable).values([{
        eventId,
        scramble: scramble.toString(),
        lastUserWhoInteracted: session.user.id,
        usersWhoMadeMoves: [],
      }]).returning(collectiveSolutionsPublicCols);
    });

    return newSolution;
  });

async function getIsSolved(currentState: Alg): Promise<boolean> {
  const kpuzzle = await cube2x2x2.kpuzzle();
  const isSolved = kpuzzle
    .defaultPattern()
    .applyAlg(currentState)
    .experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });

  return isSolved;
}

export const makeCollectiveCubingMoveSF = actionClient.metadata({ permissions: null })
  .inputSchema(z.strictObject({
    move: z.enum(nxnMoves),
    lastSeenSolution: z.string(),
  }))
  .action<CollectiveSolutionResponse>(async ({ parsedInput: { move, lastSeenSolution }, ctx: { session } }) => {
    const [ongoingSolution] = await db.select().from(csTable).where(eq(csTable.state, "ongoing")).limit(1);

    if (!ongoingSolution) {
      throw new CcActionError("The puzzle is already solved", { data: { isSolved: true } });
    }

    if (session.user.id === ongoingSolution.lastUserWhoInteracted) {
      throw new CcActionError(
        ongoingSolution.solution
          ? "You may not make two moves in a row"
          : "You scrambled the cube, so you may not make the first move",
      );
    }

    if (ongoingSolution.solution !== lastSeenSolution) {
      throw new CcActionError("The state of the cube has changed before your move", { data: ongoingSolution });
    }

    const solution = new Alg(ongoingSolution.solution).concat(move);
    const state = await getIsSolved(new Alg(ongoingSolution.scramble).concat(solution)) ? "solved" : "ongoing";

    const [newOngoingSolution] = await db.update(csTable).set({
      state,
      solution: solution.toString(),
      lastUserWhoInteracted: session.user.id,
      usersWhoMadeMoves: !ongoingSolution.usersWhoMadeMoves.includes(session.user.id)
        ? [...ongoingSolution.usersWhoMadeMoves, session.user.id]
        : ongoingSolution.usersWhoMadeMoves,
    }).where(eq(csTable.id, ongoingSolution.id)).returning(collectiveSolutionsPublicCols);

    return newOngoingSolution;
  });
