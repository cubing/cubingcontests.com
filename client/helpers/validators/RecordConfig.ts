import z from "zod";
import { RecordTypeValues } from "~/helpers/types";

export const RecordConfigValidator = z.strictObject({
  recordTypeId: z.enum(RecordTypeValues),
  label: z.string().nonempty(),
  active: z.boolean(),
  order: z.int().min(0),
  color: z.string().regex(/^\#[0-9a-f]{6}$/),
});

export type RecordConfigDto = z.infer<typeof RecordConfigValidator>;
