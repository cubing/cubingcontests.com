import { z } from "zod";

export const CoordinatesValidator = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
});
