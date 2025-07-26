import type { NavigationItem } from "~/helpers/types/NavigationItem.ts";

export const tabs: NavigationItem[] = [
  { title: "General", value: "general", route: "/rules" },
  { title: "Unofficial Competitions", shortTitle: "Unofficial", value: "unofficial", route: "/rules/unofficial" },
  { title: "Meetups", value: "meetups", route: "/rules/meetups" },
];
