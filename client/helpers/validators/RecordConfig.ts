import z from "zod";

export const RecordConfigValidator = z.strictObject({
  recordTypeId: z.string().nonempty().max(4),
  label: z.string().nonempty(),
  active: z.boolean(),
  order: z.int().min(0),
  color: z.string().regex(/^\#[0-9a-f]{6}$/),
});

export type RecordConfigDto = z.infer<typeof RecordConfigValidator>;
