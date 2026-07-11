import z from "zod";
import { RoundNumberValidator } from "~/helpers/validators/Validators.ts";

export const EnterAttemptPayloadValidator = z
  .strictObject({
    spaceId: z.string().nonempty().default("default"),
    competitionId: z.string().nonempty(),
    eventId: z.string().nonempty(),
    roundNumber: RoundNumberValidator,
    registrantId: z
      .union([z.int().min(1), z.string().regex(/^[0-9]+(,[0-9]+)*$/)], {
        error: "registrantId must be an integer or a string containing comma-separated integers",
      })
      .optional(),
    wcaId: z
      .string()
      .regex(/^[0-9A-Za-z]+(,[0-9A-Za-z]+)*$/, { error: "wcaId must be a string containing comma-separated WCA IDs" })
      .optional(),
    attemptNumber: z.int().min(1),
    attemptResult: z.int().refine((val) => val !== 0, { error: "You cannot submit an empty attempt" }),
  })
  .superRefine((val, ctx) => {
    if ((val.registrantId === undefined) === (val.wcaId === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "Please provide either a registrantId or a wcaId (but not both)",
        input: val.registrantId,
      });
    }
  });

export type EnterAttemptPayloadDto = z.infer<typeof EnterAttemptPayloadValidator>;
