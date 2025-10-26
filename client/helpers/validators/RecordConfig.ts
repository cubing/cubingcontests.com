import z from "zod";
import { RecordCategoryValues, RecordTypeValues } from "~/helpers/types.ts";

export const RecordConfigValidator = z.strictObject({
  recordTypeId: z.enum(RecordTypeValues),
  category: z.enum(RecordCategoryValues),
  label: z.string().nonempty(),
  active: z.boolean(),
  rank: z.int().min(1),
  color: z.string().regex(/^\#[0-9a-f]{6}$/),
});

export type RecordConfigDto = z.infer<typeof RecordConfigValidator>;
