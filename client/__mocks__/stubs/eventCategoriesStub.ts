import type { InsertEventCategory } from "~/server/db/schema/event-categories.ts";

export const eventCategoriesStub: InsertEventCategory[] = [
  {
    // id: 1,
    categoryId: "unofficial",
    rank: 10,
    name: "Unofficial",
    color: "#fff",
    hidden: false,
    videoBased: false,
  },
  {
    // id: 2,
    categoryId: "wca",
    rank: 20,
    name: "WCA",
    color: "#fff",
    hidden: false,
    videoBased: false,
  },
  {
    // id: 3,
    categoryId: "extreme-bld",
    rank: 30,
    name: "Extreme BLD",
    color: "#fff",
    hidden: false,
    videoBased: true,
  },
  {
    // id: 4,
    categoryId: "miscellaneous",
    rank: 40,
    name: "Miscellaneous",
    color: "#fff",
    hidden: false,
    videoBased: false,
  },
].map((e) => ({ ...e, organizationId: "default" }));
