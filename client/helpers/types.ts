import type { ApiKey } from "@better-auth/api-key";
import type { authClient } from "~/helpers/auth-client.ts";
import type { FullMemberRequest } from "~/server/db/schema/member-requests.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";

// Other types

export type Theme = "dark" | "light";

export type ResultRankingType = "single" | "average" | "mean";

export type ListPageMode = "view" | "add" | "edit";

export type InputPerson = PersonResponse | null;

export type OrganizationMetadata = {
  private: boolean;
  contactEmail: string;
  showDonationLinks: boolean;
  communicationsAgreed?: boolean;
};

export type OrganizationDetails = Pick<typeof authClient.$Infer.Organization, "id" | "name" | "slug" | "logo"> & {
  metadata: OrganizationMetadata;
  subscription?: {
    plan: "basic" | "premium";
    limits: {
      monthlyContests: number;
      competitors: number;
    };
  };
};

export type FullSession = typeof authClient.$Infer.Session & {
  member?: typeof authClient.$Infer.Member;
  organization?: OrganizationDetails;
};

export type Creator = {
  userId: string;
  name: string;
  email: string;
  person: {
    id: number;
    name: string;
    localizedName: string | null;
    regionCode: string;
    wcaId: string | null;
  } | null;
};

export const EventFormatValues = [
  "time", // 2 decimals of precision
  "time-3d", // 3 decimals of precision
  "number", // for Fewest Moves events
  "multi",
] as const;
export type EventFormat = (typeof EventFormatValues)[number];

export const RoundFormatValues = ["a", "5", "m", "3", "2", "1"] as const;
export type RoundFormat = (typeof RoundFormatValues)[number];

export const RoundTypeValues = ["1", "2", "3", "4", "5", "6", "7", "8", "s", "f"] as const;
export type RoundType = (typeof RoundTypeValues)[number];

export const RoundProceedValues = ["percentage", "number"] as const;
export type RoundProceed = (typeof RoundProceedValues)[number];

// This will be deleted once event categories are stored in the DB
export const EventCategoryValues = ["unofficial", "wca", "extreme-bld", "miscellaneous", "removed"] as const;
export type EventCategory = (typeof EventCategoryValues)[number];

export const RecordCategoryValues = ["competitions", "meetups", "online"] as const;
export type RecordCategory = (typeof RecordCategoryValues)[number];

export const ContestTypeValues = ["comp", "meetup", "online", "wca-comp"] as const;
export type ContestType = (typeof ContestTypeValues)[number];

export const ContestStateValues = ["created", "approved", "ongoing", "finished", "published", "removed"] as const;
export type ContestState = (typeof ContestStateValues)[number];

export const RegionTypeValues = [
  "country", // actual country in the World (this is important for determining the time zone used for a contest)
  "region", // the region of a country (e.g. state, county, prefecture, etc.); can be used as region of representation for a person
  "super-region", // determines the super region record type (e.g. ER, AsR, etc.); can be used as the region for a contest
  "meta-region", // doesn't correspond to any type of record; can be used as the region for a contest
] as const;
export type RegionType = (typeof RegionTypeValues)[number];

export type EventWrPair = {
  eventId: string;
  best?: number;
  average?: number;
};

export type GetOrCreatePersonObject = {
  person: PersonResponse;
  isNew: boolean;
};

export type MemberRequestDetails = {
  memberRequest: FullMemberRequest | null;
  ownRequestedPersonId?: number;
};

export type FeaturesInfo = {
  aboutPageEnabled: boolean;
  rulesPageEnabled: boolean;
  modInstructionsPageEnabled: boolean;
  publicExportsEnabled: boolean;
  videoBasedResultsEnabled: boolean;
  privacyPolicy: "disabled" | "policy-contents" | string;
};

export type ContestApiKeyMetadata = {
  organizationId: string;
  competitionId: string;
};

export type ContestApiKey = Pick<ApiKey, "id" | "name" | "rateLimitMax" | "createdAt" | "expiresAt"> & {
  metadata: ContestApiKeyMetadata;
};
