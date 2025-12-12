import z from "zod";
import { C } from "../constants.ts";

export const VideoBasedResultValidator = z.strictObject({
  eventId: z.string().nonempty(),
  date: z.date(),
  personIds: z
    .array(z.int())
    .min(1)
    .refine((val) => val.length === new Set(val).size, {
      error: "You cannot enter the same person twice in the same result",
    }),
  attempts: z
    .array(
      z.strictObject({
        result: z.int(),
        memo: z
          .int()
          .min(1)
          .max(C.maxTime - 1)
          .optional(),
      }),
    )
    .min(1)
    .max(5)
    .refine((val) => val.some((a) => a.result > 0) && !val.some((a) => a.result === 0), {
      error: "You cannot submit only DNF/DNS attempts, and you cannot submit empty attempts",
    }),
  videoLink: z.url(),
  discussionLink: z.url().nullable(),
});

export type VideoBasedResultDto = z.infer<typeof VideoBasedResultValidator>;
