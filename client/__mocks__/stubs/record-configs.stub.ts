import type { InsertRecordConfig } from "~/server/db/schema/record-configs";

export const recordConfigsStub = (): InsertRecordConfig[] => [
  {
    recordTypeId: "WR",
    category: "video-based-results",
    label: "WB",
    active: true,
    rank: 1, // doesn't matter for tests
    color: "#000000", // doesn't matter for tests
  },
  {
    recordTypeId: "ER",
    category: "video-based-results",
    label: "EB",
    active: true,
    rank: 1, // doesn't matter for tests
    color: "#000000", // doesn't matter for tests
  },
  {
    recordTypeId: "AsR",
    category: "video-based-results",
    label: "AsB",
    active: true,
    rank: 1, // doesn't matter for tests
    color: "#000000", // doesn't matter for tests
  },
  {
    recordTypeId: "NR",
    category: "video-based-results",
    label: "NB",
    active: true,
    rank: 1, // doesn't matter for tests
    color: "#000000", // doesn't matter for tests
  },
];
