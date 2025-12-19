import type { RoundFormat, RoundType } from "~/helpers/types.ts";
import type { InsertRound } from "~/server/db/schema/rounds.ts";

// All set to open at the bottom
export const roundsStub: InsertRound[] = [
  // 2020
  {
    competitionId: "TestMeetup2020",
    eventId: "555bf",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "3" as RoundFormat,
    timeLimitCentiseconds: 60 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestCompJan2020",
    eventId: "333_oh_bld_team_relay",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "m" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestCompFeb2020",
    eventId: "333_oh_bld_team_relay",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "m" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestCompMar2020",
    eventId: "333_oh_bld_team_relay",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "m" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  // 2023
  {
    competitionId: "TestComp2023",
    eventId: "333",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "a" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
  },
  {
    competitionId: "TestComp2023",
    eventId: "222",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "a" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
  },
  {
    competitionId: "TestComp2023",
    eventId: "333bf",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "3" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestComp2023",
    eventId: "444bf",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "3" as RoundFormat,
    timeLimitCentiseconds: 60 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestComp2023",
    eventId: "333_oh_bld_team_relay",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "m" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  // 2025
  {
    competitionId: "TestCompJan2025",
    eventId: "333_oh_bld_team_relay",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "m" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestCompFeb2025",
    eventId: "333_oh_bld_team_relay",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "m" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestCompMar2025",
    eventId: "333_oh_bld_team_relay",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "m" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
  {
    competitionId: "TestCompApr2025",
    eventId: "333_oh_bld_team_relay",
    roundNumber: 1,
    roundTypeId: "f" as RoundType,
    format: "m" as RoundFormat,
    timeLimitCentiseconds: 10 * 60 * 100,
    timeLimitCumulativeRoundIds: [],
  },
].map((r) => ({ ...r, open: true }));

export const testMeetup2020_555bf_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestMeetup2020" && r.eventId === "555bf")! + 1;
export const testCompJan2020_333_oh_bld_team_relay_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestCompJan2020" && r.eventId === "333_oh_bld_team_relay")! + 1;
export const testCompFeb2020_333_oh_bld_team_relay_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestCompFeb2020" && r.eventId === "333_oh_bld_team_relay")! + 1;
export const testCompMar2020_333_oh_bld_team_relay_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestCompMar2020" && r.eventId === "333_oh_bld_team_relay")! + 1;
export const testComp2023_333_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestComp2023" && r.eventId === "333")! + 1;
export const testComp2023_222_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestComp2023" && r.eventId === "222")! + 1;
export const testComp2023_333bf_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestComp2023" && r.eventId === "333bf")! + 1;
export const testComp2023_444bf_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestComp2023" && r.eventId === "444bf")! + 1;
export const testComp2023_333_oh_bld_team_relay_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestComp2023" && r.eventId === "333_oh_bld_team_relay")! + 1;
export const testCompJan2025_333_oh_bld_team_relay_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestCompJan2025" && r.eventId === "333_oh_bld_team_relay")! + 1;
export const testCompFeb2025_333_oh_bld_team_relay_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestCompFeb2025" && r.eventId === "333_oh_bld_team_relay")! + 1;
export const testCompMar2025_333_oh_bld_team_relay_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestCompMar2025" && r.eventId === "333_oh_bld_team_relay")! + 1;
export const testCompApr2025_333_oh_bld_team_relay_r1 =
  roundsStub.findIndex((r) => r.competitionId === "TestCompApr2025" && r.eventId === "333_oh_bld_team_relay")! + 1;
