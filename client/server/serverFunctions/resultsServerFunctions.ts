"use server";

import z from "zod";
import { actionClient } from "../safeAction.ts";
import { EventWrPair } from "~/helpers/types.ts";
import { getEventWrPairs } from "../serverUtilityFunctions.ts";

// export const createVideoBasedResultSF = actionClient.metadata({permissions: })

export const getEventWrPairsUpToDateSF = actionClient.metadata({ permissions: { videoBasedResults: ["create"] } })
  .inputSchema(z.strictObject({
    recordsUpTo: z.date(),
    excludeResultId: z.int().optional(),
  })).action<EventWrPair[]>(async ({ parsedInput: { recordsUpTo, excludeResultId } }) => {
    return await getEventWrPairs({ recordsUpTo, excludeResultId });
  });
