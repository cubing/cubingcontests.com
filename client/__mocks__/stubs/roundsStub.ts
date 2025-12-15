import type { InsertRound } from "~/server/db/schema/rounds.ts";

export const roundsStub: InsertRound[] = [
  {
    competitionId: "TestComp2023",
    eventId: "333",
    roundNumber: 1,
    roundTypeId: "f",
    format: "a",
    timeLimitCentiseconds: 10 * 60 * 100,
  },
  {
    competitionId: "TestComp2023",
    eventId: "222",
    roundNumber: 1,
    roundTypeId: "f",
    format: "a",
    timeLimitCentiseconds: 10 * 60 * 100,
  },
  {
    competitionId: "TestComp2023",
    eventId: "333bf",
    roundNumber: 1,
    roundTypeId: "f",
    format: "3",
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestComp2023",
    eventId: "444bf",
    roundNumber: 1,
    roundTypeId: "f",
    format: "3",
    timeLimitCentiseconds: 60 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestMeetup2020",
    eventId: "555bf",
    roundNumber: 1,
    roundTypeId: "f",
    format: "3",
    timeLimitCentiseconds: 60 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
];

export const testComp2023_333_r1 = roundsStub.findIndex((r) => r.eventId === "333" && r.roundNumber === 1)! + 1;
export const testComp2023_222_r1 = roundsStub.findIndex((r) => r.eventId === "222" && r.roundNumber === 1)! + 1;
export const testComp2023_333bf_r1 = roundsStub.findIndex((r) => r.eventId === "333bf" && r.roundNumber === 1)! + 1;
export const testComp2023_444bf_r1 = roundsStub.findIndex((r) => r.eventId === "444bf" && r.roundNumber === 1)! + 1;
export const testMeetup2020_555bf_r1 = roundsStub.findIndex((r) => r.eventId === "555bf" && r.roundNumber === 1)! + 1;
