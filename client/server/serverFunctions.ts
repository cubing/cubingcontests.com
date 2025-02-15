"use server";
import { find as findTimezone } from "geo-tz";
import { FetchObj } from "~/helpers/types.ts";
import { NumberInputValue } from "~/helpers/types.ts";
import { CoordinatesValidator } from "~/helpers/validators/coordinates";

export const getTimeZoneFromCoords = async (
  latitude: NumberInputValue,
  longitude: NumberInputValue,
): Promise<FetchObj<string>> => {
  const parsed = CoordinatesValidator.safeParse({ latitude, longitude });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.errors.map((e) => e.message),
    };
  }

  const timeZone = findTimezone(parsed.data.latitude, parsed.data.longitude).at(
    0,
  );

  if (!timeZone) return { success: false, errors: ["Time zone not found"] };

  return await Promise.resolve({ success: true, data: timeZone });
};
