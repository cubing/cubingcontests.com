import z from "zod";
import { C } from "../constants.ts";

export const WcaIdValidator = z.string().uppercase().length(10).regex(C.wcaIdRegex);

export const ColorValidator = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
