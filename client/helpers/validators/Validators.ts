import z from "zod/v4";

export const WcaIdValidator = z.string().uppercase().length(10);
