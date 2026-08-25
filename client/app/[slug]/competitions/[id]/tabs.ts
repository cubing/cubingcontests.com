import type { NavigationItem } from "~/helpers/types/NavigationItem.ts";
import { slugPath } from "~/helpers/utility-functions.ts";
import type { ContestResponse } from "~/server/db/schema/contests.ts";

export function getContestTabs(slug: string, contest: Pick<ContestResponse, "competitionId" | "type">) {
  return [
    { title: "Details", value: "details", route: slugPath(slug, `/competitions/${contest.competitionId}`) },
    {
      title: "Results",
      value: "results",
      route: slugPath(slug, `/competitions/${contest.competitionId}/results`),
    },
    {
      title: "Events",
      value: "events",
      route: slugPath(slug, `/competitions/${contest.competitionId}/events`),
    },
    {
      title: "Schedule",
      value: "schedule",
      route: slugPath(slug, `/competitions/${contest.competitionId}/schedule`),
      hidden: contest.type === "meetup",
    },
  ] as const satisfies NavigationItem[];
}
