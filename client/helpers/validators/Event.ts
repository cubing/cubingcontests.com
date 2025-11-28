import z from "zod";
import { EventFormatValues, RoundFormatValues } from "~/helpers/types.ts";

export const EventValidator = z.strictObject({
  eventId: z.string().min(3).regex(/^[a-z0-9_]*$/),
  name: z.string().min(3),
  category: z.string().nonempty(),
  rank: z.int().min(1),
  format: z.enum(EventFormatValues),
  defaultRoundFormat: z.enum(RoundFormatValues),
  participants: z.int().min(1).max(20),
  submissionsAllowed: z.boolean(),
  removedWca: z.boolean(),
  hasMemo: z.boolean(),
  hidden: z.boolean(),
  description: z.string().nullable(),
  rule: z.string().nullable(),
});

export type EventDto = z.infer<typeof EventValidator>;
