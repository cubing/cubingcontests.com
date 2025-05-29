"use server";

import { find as findTimezone } from "geo-tz";
import type { FetchObj } from "~/helpers/types/FetchObj.ts";
import type { NumberInputValue } from "~/helpers/types.ts";
import { db } from "~/server/db/provider.ts";
import {
  CollectiveSolutionResponse,
  collectiveSolutions as csTable,
  collectiveSolutionsPublicCols,
  InsertCollectiveSolution,
} from "~/server/db/schema/collective-solutions.ts";
import { eq, ne } from "drizzle-orm";
import { randomScrambleForEvent } from "cubing/scramble";
import { cube2x2x2 } from "cubing/puzzles";
import { Alg } from "cubing/alg";
import { authorizeUser, getValidationError } from "~/server/utilityServerFunctions.ts";
import { type NxNMove, nxnMoves } from "~/helpers/types/NxNMove.ts";
import { z } from "zod/v4";

const CoordinatesValidator = z.strictObject({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
});

export async function getTimeZoneFromCoordsSF(
  dto: { latitude: NumberInputValue; longitude: NumberInputValue },
): Promise<FetchObj<string>> {
  const parsed = CoordinatesValidator.safeParse(dto);
  if (!parsed.success) return getValidationError(parsed.error);
  const { data: { latitude, longitude } } = parsed;

  const timeZone = findTimezone(latitude, longitude).at(0);

  if (!timeZone) return { success: false, error: { code: "NOT_FOUND" } };

  return await Promise.resolve({ success: true, data: timeZone });
}

export async function getCurrentCollectiveCubingSolutionSF(): Promise<FetchObj<CollectiveSolutionResponse | null>> {
  const [currentSolution] = await db.select(collectiveSolutionsPublicCols).from(csTable).where(
    ne(csTable.state, "archived"),
  ).limit(1);

  return { success: true, data: currentSolution ?? null };
}

export async function startNewCollectiveCubingSolutionSF(): Promise<FetchObj<CollectiveSolutionResponse>> {
  const { user } = await authorizeUser();

  const [ongoingSolution] = await db.select().from(csTable).where(eq(csTable.state, "ongoing")).limit(1);

  if (ongoingSolution) {
    return {
      success: false,
      error: { code: "CONFLICT", data: ongoingSolution },
    };
  }

  const eventId = "222";
  const scramble = await randomScrambleForEvent(eventId);
  const newCollectiveSolution: InsertCollectiveSolution = {
    eventId,
    scramble: scramble.toString(),
    lastUserWhoInteracted: user.id,
    usersWhoMadeMoves: [],
  };
  const [newSolution] = await db.transaction(async (tx) => {
    await tx.update(csTable).set({ state: "archived" }).where(eq(csTable.state, "solved"));
    return await tx.insert(csTable).values([newCollectiveSolution]).returning(collectiveSolutionsPublicCols);
  });

  return {
    success: true,
    data: newSolution,
  };
}

async function getIsSolved(currentState: Alg): Promise<boolean> {
  const kpuzzle = await cube2x2x2.kpuzzle();
  const isSolved = kpuzzle
    .defaultPattern()
    .applyAlg(currentState)
    .experimentalIsSolved({
      ignorePuzzleOrientation: true,
      ignoreCenterOrientation: true,
    });

  return isSolved;
}

const MakeCollectiveCubingMoveValidator = z.strictObject({
  move: z.enum(nxnMoves),
  lastSeenSolution: z.string(),
});

export async function makeCollectiveCubingMoveSF(
  dto: { move: NxNMove; lastSeenSolution: string },
): Promise<FetchObj<CollectiveSolutionResponse>> {
  const parsed = MakeCollectiveCubingMoveValidator.safeParse(dto);
  if (!parsed.success) return getValidationError(parsed.error);
  const { data: { move, lastSeenSolution } } = parsed;
  const { user } = await authorizeUser();

  const [ongoingSolution] = await db.select().from(csTable).where(eq(csTable.state, "ongoing")).limit(1);

  if (!ongoingSolution) {
    return { success: false, error: { code: "NO_ONGOING_SOLUTION" } };
  }

  if (user.id === ongoingSolution.lastUserWhoInteracted) {
    const message = ongoingSolution.solution
      ? "You may not make two moves in a row"
      : "You scrambled the cube, so you may not make the first move";
    return {
      success: false,
      error: { code: "CANT_MAKE_MOVE", message },
    };
  }

  if (ongoingSolution.solution !== lastSeenSolution) {
    return {
      success: false,
      error: { code: "OUT_OF_DATE", data: ongoingSolution },
    };
  }

  const solution = new Alg(ongoingSolution.solution).concat(move);
  const state = await getIsSolved(new Alg(ongoingSolution.scramble).concat(solution)) ? "solved" : "ongoing";
  console.log(state, solution.toString());

  const [newOngoingSolution] = await db.update(csTable).set({
    state,
    solution: solution.toString(),
    lastUserWhoInteracted: user.id,
    usersWhoMadeMoves: !ongoingSolution.usersWhoMadeMoves.includes(user.id)
      ? [...ongoingSolution.usersWhoMadeMoves, user.id]
      : ongoingSolution.usersWhoMadeMoves,
  }).where(eq(csTable.id, ongoingSolution.id)).returning(collectiveSolutionsPublicCols);

  return { success: true, data: newOngoingSolution };
}
