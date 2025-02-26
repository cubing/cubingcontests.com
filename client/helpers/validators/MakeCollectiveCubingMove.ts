import { z } from "zod";
import { nxnMoves } from "~/helpers/types/NxNMove.ts";

export const MakeCollectiveCubingMoveValidator = z.object({
  move: z.enum(nxnMoves),
  lastSeenSolution: z.string(),
});
