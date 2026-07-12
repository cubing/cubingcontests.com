"use server";

import { Alg } from "cubing/alg";
import { cube2x2x2 } from "cubing/puzzles";
import { randomScrambleForEvent } from "cubing/scramble";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { nxnMoves } from "~/helpers/types/NxNMove.ts";
import type { FeaturesInfo, OrganizationDetails } from "~/helpers/types.ts";
import { auth, stripeClient } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import {
  type CurrentCollectiveSolution,
  collectiveSolutionsPublicCols,
  collectiveSolutionsTable as csTable,
} from "~/server/db/schema/collective-solutions.ts";
import { actionClient, RrActionError } from "../safeAction.ts";
import { getOrgDetails, getSettingFromDb, logMessage } from "../server-only-functions/server-only-functions.ts";

export const logErrorSF = actionClient
  .metadata({ auth: null })
  .inputSchema(
    z.strictObject({
      errorMessage: z.string().nonempty(),
    }),
  )
  .action(async ({ parsedInput: { errorMessage } }) => {
    logMessage("RR5000", errorMessage, { sendErrorLogEmail: true });
  });

export const getOrgDetailsSF = actionClient
  .metadata({ auth: null })
  .inputSchema(
    z.union([
      z.strictObject({
        id: z.string().nonempty().optional(),
        slug: z.never().optional(),
      }),
      z.strictObject({
        id: z.never().optional(),
        slug: z.string().nonempty().optional(),
      }),
    ]),
  )
  .action<OrganizationDetails>(async ({ parsedInput: { id, slug }, ctx: { session } }) => {
    return await getOrgDetails({ session: session?.session, id, slug });
  });

export const getCurrentCollectiveCubingSolutionSF = actionClient
  .metadata({ auth: null })
  .action<CurrentCollectiveSolution | null>(async () => {
    // Doing it like this, because authentication is optional for this server function
    const session = await auth.api.getSession({ headers: await headers() });

    const collectiveSolution = await db.query.collectiveSolutions.findFirst({
      columns: {
        attemptNumber: true,
        state: true,
        scramble: true,
        solution: true,
        lastUserWhoInteractedId: true,
      },
      where: { state: { ne: "archived" } },
    });

    if (!collectiveSolution) return null;

    const { lastUserWhoInteractedId, ...rest } = collectiveSolution;
    return { ...rest, currentUserInteractedLast: session?.user.id === lastUserWhoInteractedId };
  });

export const startNewCollectiveCubingSolutionSF = actionClient
  .metadata({ auth: { useOrganization: false } })
  .action<CurrentCollectiveSolution>(async ({ ctx: { session } }) => {
    logMessage("RR0029", "Starting new Collective Cubing solution");

    const ongoingSolution = await db.query.collectiveSolutions.findFirst({ where: { state: "ongoing" } });
    if (ongoingSolution) throw new RrActionError("The cube has already been scrambled", { data: ongoingSolution });

    const eventId = "222"; // the collective-cubing-enabled setting also references 2x2x2
    const scramble = await randomScrambleForEvent(eventId);

    const [createdSolution] = await db.transaction(async (tx) => {
      await tx.update(csTable).set({ state: "archived" }).where(eq(csTable.state, "solved"));

      return await tx
        .insert(csTable)
        .values({
          eventId,
          scramble: scramble.toString(),
          lastUserWhoInteractedId: session.user.id,
          usersWhoMadeMoves: [],
        })
        .returning(collectiveSolutionsPublicCols);
    });

    return { ...createdSolution, currentUserInteractedLast: true };
  });

async function getIsSolved(currentState: Alg): Promise<boolean> {
  const kpuzzle = await cube2x2x2.kpuzzle();
  const isSolved = kpuzzle
    .defaultPattern()
    .applyAlg(currentState)
    .experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });

  return isSolved;
}

export const makeCollectiveCubingMoveSF = actionClient
  .metadata({ auth: { useOrganization: false } })
  .inputSchema(
    z.strictObject({
      move: z.enum(nxnMoves),
      lastSeenSolution: z.string(),
    }),
  )
  .action<CurrentCollectiveSolution>(
    async ({
      parsedInput: { move, lastSeenSolution },
      ctx: {
        session: { user },
      },
    }) => {
      const [ongoingSolution] = await db.select().from(csTable).where(eq(csTable.state, "ongoing")).limit(1);

      if (!ongoingSolution) {
        throw new RrActionError("The puzzle is already solved", { data: { isSolved: true } });
      }

      if (user.id === ongoingSolution.lastUserWhoInteractedId) {
        throw new RrActionError(
          ongoingSolution.solution
            ? "You may not make two moves in a row"
            : "You scrambled the cube, so you may not make the first move",
        );
      }

      if (ongoingSolution.solution !== lastSeenSolution)
        throw new RrActionError("The state of the cube has changed before your move", { data: ongoingSolution });

      const solution = new Alg(ongoingSolution.solution).concat(move);
      const state = (await getIsSolved(new Alg(ongoingSolution.scramble).concat(solution))) ? "solved" : "ongoing";

      const [updatedSolution] = await db
        .update(csTable)
        .set({
          state,
          solution: solution.toString(),
          lastUserWhoInteractedId: user.id,
          usersWhoMadeMoves: !ongoingSolution.usersWhoMadeMoves.includes(user.id)
            ? [...ongoingSolution.usersWhoMadeMoves, user.id]
            : ongoingSolution.usersWhoMadeMoves,
        })
        .where(eq(csTable.id, ongoingSolution.id))
        .returning(collectiveSolutionsPublicCols);

      return { ...updatedSolution, currentUserInteractedLast: true };
    },
  );

export const getFeaturesInfoSF = actionClient
  .metadata({ auth: null })
  .inputSchema(z.strictObject({ organizationId: z.string().nonempty().optional() }))
  .action<FeaturesInfo>(async ({ parsedInput: { organizationId }, ctx: { session } }) => {
    if (
      organizationId &&
      session.session.activeOrganizationId &&
      organizationId !== session.session.activeOrganizationId
    ) {
      throw new RrActionError("You are not authorized to access this organization");
    }

    const [
      organization,
      aboutPageContent,
      rulesPageContent,
      modInstructionsPageContent,
      videoBasedResultsEnabled,
      publicExportsToKeep,
      privacyPolicy,
    ] = await Promise.all([
      organizationId ? getOrgDetails({ session: session.session, id: organizationId }) : undefined,
      organizationId ? getSettingFromDb({ key: "about-page-content", organizationId, optional: true }) : undefined,
      organizationId ? getSettingFromDb({ key: "rules-page-content", organizationId, optional: true }) : undefined,
      organizationId
        ? getSettingFromDb({ key: "moderator-instructions-page-content", organizationId, optional: true })
        : undefined,
      organizationId ? getSettingFromDb({ key: "video-based-results-enabled", organizationId }) : undefined,
      getSettingFromDb({ key: "public-exports-to-keep", organizationId: null }),
      getSettingFromDb({ key: "privacy-policy", organizationId: null, optional: true }),
    ]);

    return {
      aboutPageEnabled: Boolean(aboutPageContent),
      rulesPageEnabled: Boolean(rulesPageContent),
      modInstructionsPageEnabled: Boolean(modInstructionsPageContent),
      videoBasedResultsEnabled: videoBasedResultsEnabled === "true",
      publicExportsEnabled:
        !!organization && organization.subscription?.plan !== "basic" && Number(publicExportsToKeep) > 0,
      privacyPolicy: !privacyPolicy
        ? "disabled"
        : z.url().safeParse(privacyPolicy).success
          ? privacyPolicy
          : "policy-contents",
    };
  });

export const getPrivacyPolicySF = actionClient.metadata({ auth: null }).action<string | null>(async () => {
  return await getSettingFromDb({ key: "privacy-policy", organizationId: null, optional: true });
});

export const getStripePriceSF = actionClient
  .metadata({ auth: { useOrganization: true } })
  .inputSchema(
    z.strictObject({
      lookupKey: z.string().nonempty(),
    }),
  )
  .action<{ amount: number; currency: string }>(async ({ parsedInput: { lookupKey } }) => {
    if (!stripeClient) throw new RrActionError("Billing is disabled on this instance");

    const prices = await stripeClient.prices.list({ lookup_keys: [lookupKey], limit: 1 });

    if (prices.data.length === 0 || !prices.data[0].unit_amount) throw new RrActionError("Price not found");

    const price = prices.data[0];
    return {
      amount: price.unit_amount!,
      currency: price.currency.toUpperCase(),
    };
  });
