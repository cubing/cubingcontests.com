import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { type IContestEvent, type IRecordPair } from "~/helpers/types.ts";
import { compareAvgs, compareSingles, getBestAndAverage, setResultRecords } from "~/helpers/sharedFunctions.ts";
import { eventsStub } from "~/__mocks__/events.stub.ts";
import { newContestEventsStub, newFakeContestEventsStub } from "~/__mocks__/new-competition-events.stub.ts";
import type { Attempt } from "~/server/db/schema/results.ts";

const mockTimeEvent = eventsStub().find((e) => e.eventId === "333")!;

describe("getBestAndAverage", () => {
  it("Sets average to 0 when there is only one attempt", () => {
    const attempts: IAttempt[] = [{ result: 1234 }];

    const { best, average } = getBestAndAverage(attempts, mockTimeEvent, "1");

    expect(best).toBe(1234);
    expect(average).toBe(0);
  });

  it("Sets average to 0 when there are only 2 attempts", () => {
    const attempts: Attempt[] = [{ result: 1234 }, { result: 2345 }];

    const { best, average } = getBestAndAverage(attempts, mockTimeEvent, "2");

    expect(best).toBe(1234);
    expect(average).toBe(0);
  });
});

describe("compareSingles", () => {
  it("compares singles correctly when a < b", () => {
    expect(compareSingles({ best: 10 }, { best: 11 })).toBeLessThan(0);
  });

  it("compares singles correctly when a > b", () => {
    expect(compareSingles({ best: 10 }, { best: 9 })).toBeGreaterThan(0);
  });

  it("compares singles correctly when a = b", () => {
    expect(compareSingles({ best: 10 }, { best: 10 })).toBe(0);
  });

  it("compares singles correctly when a is DNF", () => {
    expect(compareSingles({ best: -1 }, { best: 10 })).toBeGreaterThan(0);
  });

  it("compares singles correctly when b is DNF", () => {
    expect(compareSingles({ best: 10 }, { best: -1 })).toBeLessThan(0);
  });

  it("compares singles correctly when a and b are DNF", () => {
    expect(compareSingles({ best: -1 }, { best: -1 })).toBe(0);
  });

  it("compares singles correctly when a is DNS and b is DNF", () => {
    expect(compareSingles({ best: -2 }, { best: -1 })).toBe(0);
  });

  it("compares singles correctly when a is DNF and b is DNS", () => {
    expect(compareSingles({ best: -1 }, { best: -2 })).toBe(0);
  });

  describe("compare Multi-Blind singles", () => {
    it("compares Multi-Blind singles correctly when a is 2/2 and b is 9/10", () => {
      expect(
        compareSingles({ best: 999700043890000 }, { best: 999100774000001 }),
      ).toBeGreaterThan(0);
    });

    it("compares Multi-Blind singles correctly when a is 3/3 59.68 and b is 3/3 1:05.57", () => {
      expect(
        compareSingles({ best: 999600059680000 }, { best: 999600065570000 }),
      ).toBeLessThan(
        0,
      );
    });

    it("compares Multi-Blind singles correctly when a is 51/55 58:06 and b is 49/51 58:06", () => {
      expect(
        compareSingles({ best: 995203486000004 }, { best: 995203486000002 }),
      ).toBeGreaterThan(0);
    });

    it("compares Multi-Blind singles correctly when a is DNF (6/15) and b is DNF (1/2)", () => {
      expect(
        compareSingles({ best: -999603161000009 }, { best: -999900516420001 }),
      ).toBe(0);
    });
  });
});

describe("compareAvgs", () => {
  it("compares averages correctly when a < b", () => {
    expect(compareAvgs({ average: 10 }, { average: 11 })).toBeLessThan(0);
  });

  it("compares averages correctly when a > b", () => {
    expect(compareAvgs({ average: 10 }, { average: 9 })).toBeGreaterThan(0);
  });

  it("compares averages correctly when b is DNF", () => {
    expect(compareAvgs({ average: 10 }, { average: -1 })).toBeLessThan(0);
  });

  it("compares averages correctly when a is DNF", () => {
    expect(compareAvgs({ average: -1 }, { average: 10 })).toBeGreaterThan(0);
  });

  it("compares averages correctly when a and b are DNF", () => {
    expect(compareAvgs({ average: -1, best: 10 }, { average: -1, best: 11 }))
      .toBeLessThan(0);
  });

  it("compares same averages correctly when the singles are different", () => {
    expect(compareAvgs({ average: 10, best: 5 }, { average: 10, best: 6 }))
      .toBeLessThan(0);
  });

  it("compares same averages correctly when the singles are the same", () => {
    expect(compareAvgs({ average: 10, best: 5 }, { average: 10, best: 5 }))
      .toBe(0);
  });
});

describe("setResultRecords", () => {
  const mock333RecordPairs = (): IRecordPair[] => [
    { wcaEquivalent: "WR", best: 1000, average: 1100 },
  ];

  const mock222RecordPairs = (): IRecordPair[] => [
    { wcaEquivalent: "WR", best: 124, average: 211 },
  ];

  const mockBLDRecordPairs = (): IRecordPair[] => [
    { wcaEquivalent: "WR", best: 2217, average: 2795 },
  ];

  it("sets new 3x3x3 records correctly", () => {
    const contestEvent = newContestEventsStub().find((ce) => ce.event.eventId === "333")!;
    const result = setResultRecords(
      contestEvent.rounds[0].results[0],
      contestEvent.event,
      mock333RecordPairs(),
    );

    // 6.86 single and 8.00 average WRs
    expect(result.regionalAverageRecord).toBe("WR");
    expect(result.regionalSingleRecord).toBe("WR");
  });

  it("updates 3x3x3 BLD single record correctly", () => {
    const contestEvent = newFakeContestEventsStub().find((ce) => ce.event.eventId === "333bf")!;
    const result = setResultRecords(contestEvent.rounds[0].results[0], contestEvent.event, mockBLDRecordPairs());

    expect(result.regionalSingleRecord).toBe("WR");
    expect(result.regionalAverageRecord).toBeUndefined();
  });

  it("doesn't set avg records when the # of attempts doesn't match the default format's # of attempts", () => {
    const contestEvent = newFakeContestEventsStub().find((ce) => ce.event.eventId === "222")!;
    const result = setResultRecords(contestEvent.rounds[2].results[0], contestEvent.event, mock222RecordPairs());

    expect(result.regionalSingleRecord).toBe("WR");
    expect(result.best).toBe(100);
    expect(result.regionalAverageRecord).toBeUndefined();
    expect(result.average).toBe(101);
  });
});
