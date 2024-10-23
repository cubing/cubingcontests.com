import { INavigationItem } from "~/helpers/types.ts";

export const tabs: INavigationItem[] = [
  {
    title: "WCA Competition",
    shortTitle: "WCA",
    value: "wca",
    route: "/moderator-instructions/wca",
  },
  {
    title: "Unofficial Competition",
    shortTitle: "Unofficial",
    value: "unofficial",
    route: "/moderator-instructions/unofficial",
  },
  {
    title: "Meetup",
    value: "meetup",
    route: "/moderator-instructions/meetup",
  },
];
