import z from "zod";
import { EventFormatValues, RoundFormatValues } from "~/helpers/types.ts";

export const EventValidator = z
  .strictObject({
    eventId: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-z0-9_]*$/, {
        error: "The event ID can only contain lowercase alphanumeric characters and underscores (_)",
      }),
    name: z.string().min(3),
    categoryId: z.int(),
    rank: z.int().min(1),
    format: z.enum(EventFormatValues),
    defaultRoundFormat: z.enum(RoundFormatValues),
    participants: z.int().min(1).max(20),
    higherIsBetter: z.boolean(),
    submissionsAllowed: z.boolean(),
    hasMemo: z.boolean(),
    hidden: z.boolean(),
    description: z.string().nullable(),
    rule: z.string().nullable(),
    importantInfo: z.string().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.hasMemo && val.format === "number") {
      ctx.addIssue({
        code: "custom",
        message: 'An event with the format "number" can\'t have memorization time enabled',
        input: val.hasMemo,
      });
    }

    if (val.higherIsBetter && val.format === "multi") {
      ctx.addIssue({
        code: "custom",
        message: "An event with the Multi format can't use higher-is-better",
        input: val.higherIsBetter,
      });
    }
  });

export type EventDto = z.infer<typeof EventValidator>;
