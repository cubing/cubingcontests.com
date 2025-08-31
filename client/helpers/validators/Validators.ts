import z from "zod";

export const WcaIdValidator = z.string().uppercase().length(10);
