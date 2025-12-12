import z from "zod";
import { RecordCategoryValues, RecordTypeValues } from "~/helpers/types.ts";
import { ColorValidator } from "~/helpers/validators/Validators.ts";

export const RecordConfigValidator = z.strictObject({
  recordTypeId: z.enum(RecordTypeValues),
  category: z.enum(RecordCategoryValues),
  label: z.string().nonempty(),
  active: z.boolean(),
  rank: z.int().min(1),
  color: ColorValidator,
});

export type RecordConfigDto = z.infer<typeof RecordConfigValidator>;
