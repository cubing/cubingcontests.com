import { authClient } from "~/helpers/authClient.ts";
import { PersonResponse } from "~/server/db/schema/persons.ts";

// WCIF types
export type {
  Activity as WcifActivity,
  Competition as WcifCompetition,
  Event as WcifEvent,
  Round as WcifRound,
  Schedule as WcifSchedule,
} from "@wca/helpers";

// Other types

export type ResultRankingType = "single" | "average" | "mean";

export type PageSize = "A4" | "A6";

export type ListPageMode = "view" | "add" | "edit";

export type InputPerson = PersonResponse | null;

export type Creator = Pick<typeof authClient.$Infer.Session.user, "id" | "username" | "email">;

export type WcaPersonDto = {
  person: PersonResponse;
  isNew: boolean;
};

export type CcServerErrorObject = {
  message: string;
  data?: any;
};

export const EventFormatValues = [
  "time",
  "number", // for Fewest Moves events
  "multi",
] as const;
export type EventFormat = typeof EventFormatValues[number];

export const RoundFormatValues = ["a", "m", "3", "2", "1"] as const;
export type RoundFormat = typeof RoundFormatValues[number];

export const RoundTypeValues = ["1", "2", "3", "4", "5", "6", "7", "8", "s", "f"] as const;
export type RoundType = typeof RoundTypeValues[number];

export const EventCategoryValues = [
  "unofficial",
  "wca",
  "extreme-bld",
  "miscellaneous",
  "removed",
] as const;
export type EventCategory = typeof EventCategoryValues[number];
