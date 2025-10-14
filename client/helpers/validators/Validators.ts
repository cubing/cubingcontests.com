import z from "zod";
import { C } from "../constants.ts";

export const WcaIdValidator = z.string().uppercase().length(10).regex(C.wcaIdRegex);
