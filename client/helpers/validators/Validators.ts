import z from "zod";
import { C } from "../constants.ts";

export const WcaIdValidator = z.string().uppercase().length(10).regex(C.wcaIdRegex);

export const ColorValidator = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);

export const RoundNumberValidator = z.int().min(1).max(C.maxRounds);

export const RegionCodeValidator = z
  .string()
  .min(2, { error: "Invalid region code" })
  .max(2, { error: "Invalid region code" });

export const TrimmedStringWithEmptyAsNull = z
  .string()
  .nullable()
  .transform((val) => val?.trim() || null);
