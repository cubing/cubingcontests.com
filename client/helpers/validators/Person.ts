import z from "zod";
import { WcaIdValidator } from "./Validators.ts";

const personNameRegex = /^[^()[\]{}]*$/;

export const PersonValidator = z.strictObject({
  name: z.string().min(3).regex(personNameRegex),
  localizedName: z.string().min(2).regex(personNameRegex).optional(),
  countryIso2: z.string().length(2),
  wcaId: WcaIdValidator.optional(),
});

export type PersonDto = z.infer<typeof PersonValidator>;
