import { INavigationItem } from "~/helpers/types.ts";

export const tabs: INavigationItem[] = [
  { title: "General", value: "general", route: "/rules" },
  { title: "Unofficial Competitions", shortTitle: "Unofficial", value: "unofficial", route: "/rules/unofficial" },
  { title: "Meetups", value: "meetups", route: "/rules/meetups" },
];
