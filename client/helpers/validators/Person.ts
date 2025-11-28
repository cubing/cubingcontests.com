import z from "zod";
import { CountryCodes } from "../Countries.ts";
import { WcaIdValidator } from "./Validators.ts";

const personNameRegex = /^[^()[\]{}]*$/;

export const PersonValidator = z.strictObject({
  name: z.string().min(3).regex(personNameRegex),
  localizedName: z.string().min(2).regex(personNameRegex).nullable(),
  countryIso2: z.enum(CountryCodes),
  wcaId: WcaIdValidator.nullable(),
});

export type PersonDto = z.infer<typeof PersonValidator>;
