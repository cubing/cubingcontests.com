import z from "zod";
import { ColorValidator } from "~/helpers/validators/Validators.ts";

export const EventCategoryValidator = z.strictObject({
  categoryId: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9-_]*$/, {
      error: "The category ID can only contain lowercase alphanumeric characters, dashes (-) and underscores (_)",
    }),
  rank: z.int().min(1),
  name: z.string().min(1),
  shortName: z.string().max(15).nullable(),
  description: z.string().nullable(),
  color: ColorValidator,
  hidden: z.boolean(),
  videoBased: z.boolean(),
});

export type EventCategoryDto = z.infer<typeof EventCategoryValidator>;
