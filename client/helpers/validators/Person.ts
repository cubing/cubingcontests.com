import z from "zod/v4";
import { WcaIdValidator } from "./Validators.ts";

export const PersonValidator = z.strictObject({
  name: z.string(),
  localizedName: z.string().optional(),
  countryIso2: z.string().length(2),
  wcaId: WcaIdValidator.optional(),
});

export type PersonDto = z.infer<typeof PersonValidator>;
