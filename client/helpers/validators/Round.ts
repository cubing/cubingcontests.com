import z from "zod";
import { RoundFormatValues, RoundProceedValues, RoundTypeValues } from "~/helpers/types.ts";
import { C } from "../constants.ts";

export const RoundValidator = z.strictObject({
  id: z.int().optional(), // not needed when creating new round
  competitionId: z.string().nonempty(),
  eventId: z.string().nonempty(),
  roundNumber: z.int().min(1).max(C.maxRounds),
  roundTypeId: z.enum(RoundTypeValues),
  format: z.enum(RoundFormatValues),
  timeLimitCentiseconds: z.int().nullable(),
  timeLimitCumulativeRoundIds: z.array(z.string()).nullable(),
  cutoffAttemptResult: z.int().nullable(),
  cutoffNumberOfAttempts: z.int().nullable(),
  proceedType: z.enum(RoundProceedValues).nullable(),
  proceedValue: z.int().nullable(),
  open: z.boolean().optional(), // not needed when creating new round
});

export type RoundDto = z.infer<typeof RoundValidator>;
