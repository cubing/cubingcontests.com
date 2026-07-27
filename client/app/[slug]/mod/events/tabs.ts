import type { NavigationItem } from "~/helpers/types/NavigationItem.ts";
import { slugPath } from "~/helpers/utility-functions.ts";

export function getTabs(slug: string) {
  return [
    { title: "Events", value: "events", route: slugPath(slug, "/mod/events") },
    { title: "Event Categories", value: "categories", route: slugPath(slug, "/mod/events/categories") },
  ] as const satisfies NavigationItem[];
}
