import z from "zod";
import { RoundFormatValues, RoundProceedValues, RoundTypeValues } from "~/helpers/types.ts";
import { RoundNumberValidator } from "~/helpers/validators/Validators.ts";
import { C } from "../constants.ts";

export const RoundValidator = z
  .strictObject({
    id: z.int().optional(), // not needed when creating new round
    competitionId: z.string().nonempty(),
    eventId: z.string().nonempty(),
    roundNumber: RoundNumberValidator,
    roundTypeId: z.enum(RoundTypeValues),
    format: z.enum(RoundFormatValues),
    timeLimitCentiseconds: z.int().min(1).nullable(),
    timeLimitCumulativeRoundIds: z.array(z.int()).nullable(),
    cutoffAttemptResult: z.int().min(1).nullable(),
    cutoffNumberOfAttempts: z.int().min(1).nullable(),
    proceedType: z.enum(RoundProceedValues).nullable(),
    proceedValue: z
      .int()
      .min(C.minProceedNumber, {
        error: `A round cannot allow fewer than ${C.minProceedNumber} competitors to proceed to the next round`,
      })
      .nullable(),
    open: z.boolean().optional(), // not needed when creating new round
    brackets: z
      .array(
        z.strictObject({
          bracketNumber: z.int().min(1),
          bracketType: z.enum(["main", "losers", "double-elim-finals", "double-elim-reset", "swiss", "round-robin"]),
          stages: z.int().min(1),
          seedingStrategy: z.enum(["best-vs-worst", "best-vs-2nd", "random"]),
        }),
      )
      .nonempty()
      .nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.timeLimitCentiseconds && val.cutoffAttemptResult && val.cutoffAttemptResult > val.timeLimitCentiseconds) {
      ctx.addIssue({
        code: "custom",
        message: "The cutoff cannot be higher than the time limit",
        input: val.cutoffAttemptResult,
      });
    }

    if (val.roundTypeId === "f" && (val.proceedType || val.proceedValue)) {
      ctx.addIssue({
        code: "custom",
        message: "A final round cannot have parameters for proceeding to a subsequent round",
      });
    }

    if (val.roundTypeId !== "f" && (!val.proceedType || !val.proceedValue)) {
      ctx.addIssue({
        code: "custom",
        message: "Non-final rounds must have the parameters for proceeding to the next round set",
      });
    }

    if (val.proceedType === "percentage" && val.proceedValue && val.proceedValue > C.maxProceedPercentage) {
      ctx.addIssue({
        code: "custom",
        message: `A round cannot allow more than ${C.maxProceedPercentage}% of competitors to proceed to the next round`,
        input: val.proceedValue,
      });
    }
  });

export type RoundDto = z.infer<typeof RoundValidator>;
