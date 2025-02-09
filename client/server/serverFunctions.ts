"use server";
import { z } from "zod";
import { find as findTimezone } from "geo-tz";
import { FetchObj } from "~/helpers/types.ts";
import { NumberInputValue } from "~/helpers/types.ts";

export const getTimeZoneFromCoords = async (
  latitude: NumberInputValue,
  longitude: NumberInputValue,
): Promise<FetchObj<string>> => {
  const parsed = z.object({
    latitude: z.number().gte(-90).lte(90),
    longitude: z.number().gte(-180).lte(180),
  }).safeParse({ latitude, longitude });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.errors.map((e) => e.message),
    };
  }

  return {
    success: true,
    data: findTimezone(parsed.data.latitude, parsed.data.longitude)[0],
  };
};
