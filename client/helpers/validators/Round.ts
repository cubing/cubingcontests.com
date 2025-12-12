import z from "zod";
import { RoundFormatValues, RoundProceedValues, RoundTypeValues } from "~/helpers/types.ts";
import { C } from "../constants.ts";

export const RoundValidator = z
  .strictObject({
    id: z.int().optional(), // not needed when creating new round
    competitionId: z.string().nonempty(),
    eventId: z.string().nonempty(),
    roundNumber: z.int().min(1).max(C.maxRounds),
    roundTypeId: z.enum(RoundTypeValues),
    format: z.enum(RoundFormatValues),
    timeLimitCentiseconds: z.int().min(1).nullable(),
    timeLimitCumulativeRoundIds: z.array(z.string()).nullable(),
    cutoffAttemptResult: z.int().min(1).nullable(),
    cutoffNumberOfAttempts: z.int().min(1).nullable(),
    proceedType: z.enum(RoundProceedValues).nullable(),
    proceedValue: z.int().nullable(),
    open: z.boolean().optional(), // not needed when creating new round
  })
  .superRefine((val, ctx) => {
    if (val.timeLimitCentiseconds && val.cutoffAttemptResult && val.cutoffAttemptResult >= val.timeLimitCentiseconds) {
      ctx.addIssue({
        code: "custom",
        message: "The cutoff cannot be higher than or equal to the time limit",
        input: val.cutoffAttemptResult,
      });
    }

    if (val.proceedType === "number" && val.proceedValue && val.proceedValue >= C.minProceedNumber) {
      ctx.addIssue({
        code: "custom",
        message: `A round cannot allow fewer than ${C.minProceedNumber} competitors to proceed to the next round`,
        input: val.proceedValue,
      });
    }

    if (val.proceedType === "percentage" && val.proceedValue && val.proceedValue <= C.maxProceedPercentage) {
      ctx.addIssue({
        code: "custom",
        message: `A round cannot allow more than ${C.maxProceedPercentage}% of competitors to proceed to the next round`,
        input: val.proceedValue,
      });
    }
  });

export type RoundDto = z.infer<typeof RoundValidator>;
