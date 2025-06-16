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

// Random types

export type ResultRankingType = "single" | "average" | "mean";

export type PageSize = "A4" | "A6";

export type ListPageMode = "view" | "add" | "edit";

// undefined is the empty value, null is the invalid value
export type NumberInputValue = number | null | undefined;

export type Creator = Pick<typeof authClient.$Infer.Session.user, "id" | "username" | "email">;

export type WcaPersonDto = {
  person: PersonResponse;
  isNew: boolean;
};

export type CcServerErrorObject = {
  message: string;
  data?: any;
};
