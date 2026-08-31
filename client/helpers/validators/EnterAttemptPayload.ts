import z from "zod";
import { RoundNumberValidator } from "~/helpers/validators/Validators.ts";

export const EnterAttemptPayloadValidator = z
  .strictObject({
    spaceId: z.string().nonempty().default("default"),
    competitionId: z.string().nonempty(),
    eventId: z.string().nonempty(),
    roundNumber: RoundNumberValidator,
    personId: z
      .union([z.int().min(1), z.string().regex(/^[0-9]+(,[0-9]+)*$/)], {
        error: "personId must be an integer or a string containing comma-separated integers",
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
    if ((val.personId === undefined) === (val.wcaId === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "Please provide either a personId or a wcaId (but not both)",
        input: val.personId,
      });
    }
  });

export type EnterAttemptPayloadDto = z.infer<typeof EnterAttemptPayloadValidator>;
