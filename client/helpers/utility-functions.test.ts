import { describe, expect, it } from "vitest";
import { eventsStub } from "~/__mocks__/stubs/eventsStub.ts";
import { resultsStub } from "~/__mocks__/stubs/resultsStub";
import { C } from "~/helpers/constants.ts";
import type { EventWrPair } from "~/helpers/types";
import {
  compareAvgs,
  compareSingles,
  getAttempt,
  getBestAndAverage,
  getFormattedResult,
  setResultWorldRecords,
} from "~/helpers/utility-functions.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { Attempt, ResultResponse } from "~/server/db/schema/results";

const mockTimeEvent = eventsStub.find((e) => e.eventId === "333") as any;

const timeExamples = [
  {
    inputs: { time: "553", memo: undefined },
    outputAtt: { result: 553, memo: undefined },
  },
  {
    inputs: { time: "2453", memo: undefined },
    outputAtt: { result: 2453, memo: undefined },
  },
  {
    inputs: { time: "24253", memo: undefined },
    outputAtt: { result: 16253, memo: undefined },
  },
  {
    inputs: { time: "141786", memo: undefined },
    outputAtt: { result: 85786, memo: undefined },
  },
  {
    inputs: { time: "1000284", memo: undefined },
    outputAtt: { result: 360284, memo: undefined },
  },
  {
    inputs: { time: "11510694", memo: undefined },
    outputAtt: { result: 4266694, memo: undefined },
  },
  // With memo
  {
    inputs: { time: "51234", memo: "25842" },
    outputAtt: { result: 31234, memo: 17842 },
  },
  {
    inputs: { time: "242344", memo: "155452" },
    outputAtt: { result: 146344, memo: 95400 },
  },
  // INVALID TIMES
  {
    inputs: { time: "248344", memo: "653452" }, // 83 seconds; 65 minutes
    outputAtt: { result: NaN, memo: NaN },
  },
  {
    inputs: { time: "155452", memo: "242344" }, // memo longer than time
    outputAtt: { result: NaN, memo: NaN },
  },
  {
    inputs: { time: "25085622", memo: undefined }, // > 24 hours
    outputAtt: { result: NaN, memo: undefined },
  },
];

const mockNumberEvent = { eventId: "333fm", format: "number" } as EventResponse;
const mockMultiEvent = { eventId: "333mbf", format: "multi" } as EventResponse;
const mockOldStyleEvent = { eventId: "333mbo", format: "multi" } as EventResponse;
const mockTime3dEvent = { eventId: "333_3d", format: "time-3d" } as EventResponse;

const multiBlindExamples = [
  {
    result: 999700043890000,
    formatted: "2/2 43.89",
    memo: undefined,
    inputs: {
      time: "4389",
      solved: 2,
      attempted: 2,
      memo: undefined,
    },
  },
  {
    result: 999600065570000,
    formatted: "3/3 1:05.57",
    memo: undefined,
    inputs: {
      time: "10557",
      solved: 3,
      attempted: 3,
      memo: undefined,
    },
  },
  {
    result: 999901499000002,
    formatted: "2/4 24:59",
    memo: undefined,
    inputs: {
      time: "245900",
      solved: 2,
      attempted: 4,
      memo: undefined,
    },
  },
  {
    result: 999100774000001,
    formatted: "9/10 12:54",
    memo: undefined,
    inputs: {
      time: "125400",
      solved: 9,
      attempted: 10,
      memo: undefined,
    },
  },
  {
    result: 995203486000004,
    formatted: "51/55 58:06",
    memo: undefined,
    inputs: {
      time: "580600",
      solved: 51,
      attempted: 55,
      memo: undefined,
    },
  },
  {
    result: 995803600000008,
    formatted: "49/57 1:00:00",
    memo: undefined,
    inputs: {
      time: "1000000",
      solved: 49,
      attempted: 57,
      memo: undefined,
    },
  },
  {
    result: 89335998000047,
    formatted: "9153/9200 9:59:58", // Old Style
    memo: undefined,
    inputs: {
      time: "9595800",
      solved: 9153,
      attempted: 9200,
      memo: undefined,
    },
  },
  // DNFs
  {
    result: -999603161000009,
    formatted: "DNF (6/15 52:41)",
    memo: undefined,
    inputs: {
      time: "524100",
      solved: 6,
      attempted: 15,
      memo: undefined,
    },
  },
  {
    result: -999900516420001,
    formatted: "DNF (1/2 8:36.42)",
    memo: undefined,
    inputs: {
      time: "83642",
      solved: 1,
      attempted: 2,
      memo: undefined,
    },
  },
];

describe(getAttempt.name, () => {
  const dummyAtt = { result: 0 };

  describe("parse time attempts", () => {
    for (const example of timeExamples) {
      const { inputs, outputAtt } = example;

      it(`parses ${example.inputs.time}${example.inputs.memo ? ` with ${inputs.memo} memo` : ""} correctly`, () => {
        const output = getAttempt(dummyAtt, mockTimeEvent, inputs.time, { truncateTime: true, memo: inputs.memo });
        const expectedResult =
          !Number.isNaN(outputAtt.result) && outputAtt.result >= 60000
            ? outputAtt.result - (outputAtt.result % 100)
            : outputAtt.result;
        const expectedMemo =
          !Number.isNaN(outputAtt.memo) && outputAtt.memo && outputAtt.memo >= 60000
            ? outputAtt.memo - (outputAtt.memo % 100)
            : outputAtt.memo;

        expect(output.result).toBe(expectedResult);
        expect(output.memo).toBe(expectedMemo);
      });

      it(`parses ${inputs.time}${inputs.memo ? ` with ${inputs.memo} memo` : ""} without rounding correctly`, () => {
        const output = getAttempt(dummyAtt, mockTimeEvent, inputs.time, {
          memo: inputs.memo,
        });

        expect(output.result).toBe(outputAtt.result);
        expect(output.memo).toBe(outputAtt.memo);
      });
    }

    it("parses empty time correctly", () => {
      expect(getAttempt(dummyAtt, mockTimeEvent, "", { truncateTime: true }).result).toBe(0);
    });
  });

  describe("parse time-3d attempts", () => {
    it("parses 0.123 seconds correctly", () => {
      expect(getAttempt(dummyAtt, mockTime3dEvent, "123", { truncateTime: true }).result).toBe(123);
    });

    it("parses 1.234 seconds correctly", () => {
      expect(getAttempt(dummyAtt, mockTime3dEvent, "1234", { truncateTime: true }).result).toBe(1234);
    });

    it("parses 2.345 seconds correctly", () => {
      expect(getAttempt(dummyAtt, mockTime3dEvent, "2345", { truncateTime: true }).result).toBe(2345);
    });

    it("parses empty time-3d correctly", () => {
      expect(getAttempt(dummyAtt, mockTime3dEvent, "", { truncateTime: true }).result).toBe(0);
    });

    it("rejects times longer than 9 digits for time-3d", () => {
      expect(() => getAttempt(dummyAtt, mockTime3dEvent, "1234567890")).toThrow(
        "Times longer than 9 digits are not supported",
      );
    });

    it("rejects times >= 10 minutes for time-3d", () => {
      expect(getAttempt(dummyAtt, mockTime3dEvent, "1000000", { truncateTime: true }).result).toBeNaN();
    });

    it("accepts times just under 10 minutes for time-3d", () => {
      expect(getAttempt(dummyAtt, mockTime3dEvent, "959999", { truncateTime: true }).result).toBe(599999);
    });
  });

  describe("parse number attempts", () => {
    it("parses 36 move FMC correctly", () => {
      const output = getAttempt(dummyAtt, mockNumberEvent, "36", { truncateTime: true });
      expect(output.result).toBe(36);
      expect(output.memo).toBeUndefined();
    });

    it("parses empty number correctly", () => {
      const output = getAttempt(dummyAtt, mockNumberEvent, "", { truncateTime: true });
      expect(output.result).toBe(0);
      expect(output.memo).toBe(undefined);
    });
  });

  // TO-DO: FIX THESE TESTS AND WRITE GENERAL TESTS THAT WORK FOR ALL INSTANCES, NOT JUST CC!!!
  describe.skip("parse Multi attempts", () => {
    for (const example of multiBlindExamples) {
      const { inputs: inp } = example;

      if (Number(inp.time) <= 1002000) {
        it(`parses ${example.formatted} for Multi-Blind correctly`, () => {
          const output = getAttempt(dummyAtt, mockMultiEvent, inp.time, {
            truncateTime: true,
            solved: inp.solved,
            attempted: inp.attempted,
            memo: inp.memo,
          });
          expect(output.result).toBe(output.result);
          expect(output.memo).toBe(example.memo);
        });

        it(`disallows ${example.formatted} for Multi-Blind Old Style`, () => {
          const output = getAttempt(dummyAtt, mockOldStyleEvent, inp.time, {
            truncateTime: true,
            solved: inp.solved,
            attempted: inp.attempted,
            memo: inp.memo,
          });
          expect(output.result).toBeNaN();
          expect(output.memo).toBe(example.memo);
        });
      } else {
        it(`parses ${example.formatted} for Multi-Blind Old Style correctly`, () => {
          const output = getAttempt(dummyAtt, mockOldStyleEvent, inp.time, {
            truncateTime: true,
            solved: inp.solved,
            attempted: inp.attempted,
            memo: inp.memo,
          });
          expect(output.result).toBe(output.result);
          expect(output.memo).toBe(example.memo);
        });

        it(`disallows ${example.formatted} for Multi-Blind`, () => {
          const output = getAttempt(dummyAtt, mockMultiEvent, inp.time, {
            truncateTime: true,
            solved: inp.solved,
            attempted: inp.attempted,
            memo: inp.memo,
          });
          expect(output.result).toBeNaN();
          expect(output.memo).toBe(example.memo);
        });
      }
    }

    it("parses empty Multi-Blind attempt correctly", () => {
      expect(getAttempt(dummyAtt, mockMultiEvent, "", { truncateTime: true }).result).toBe(0);
    });

    it("disallows unknown time for Multi-Blind", () => {
      expect(
        getAttempt(dummyAtt, mockMultiEvent, C.maxTimeHumanReadable, { solved: 36, attempted: 36 }).result,
      ).toBeNaN();
    });

    it("parses Multi-Blind Old Style attempt with unknown time correctly", () => {
      expect(
        getAttempt(dummyAtt, mockOldStyleEvent, C.maxTimeHumanReadable, { solved: 36, attempted: 36 }).result,
      ).toBe(996386400000000);
    });
  });
});

describe(getFormattedResult.name, () => {
  describe("format time singles", () => {
    it("formats 0.07 correctly", () => {
      expect(getFormattedResult(7)).toBe("0.07");
    });

    it("formats 0.35 correctly", () => {
      expect(getFormattedResult(35)).toBe("0.35");
    });

    it("formats 8.80 correctly", () => {
      expect(getFormattedResult(880)).toBe("8.80");
    });

    it("formats 10.00 correctly", () => {
      expect(getFormattedResult(1000)).toBe("10.00");
    });

    it("formats 30.05 correctly", () => {
      expect(getFormattedResult(3005)).toBe("30.05");
    });

    it("formats 2:45.07 correctly", () => {
      expect(getFormattedResult(16507)).toBe("2:45.07");
    });

    // Results over ten minutes long must have no decimals
    it("formats 23:00.35 correctly", () => {
      expect(getFormattedResult(138035)).toBe("23:00");
    });

    it("formats 1:32:08(.36) correctly", () => {
      expect(getFormattedResult(552836)).toBe("1:32:08");
    });
  });

  describe("format time singles without formatting (no commas or colons)", () => {
    it("formats 0.09 without formatting correctly", () => {
      expect(getFormattedResult(9, { noDelimiterChars: true })).toBe("9");
    });

    it("formats 0.78 without formatting correctly", () => {
      expect(getFormattedResult(78, { noDelimiterChars: true })).toBe("78");
    });

    it("formats 20.00 correctly", () => {
      expect(getFormattedResult(2000, { noDelimiterChars: true })).toBe("2000");
    });

    it("formats 1:08.45 without formatting correctly", () => {
      expect(getFormattedResult(6845, { noDelimiterChars: true })).toBe("10845");
    });

    it("formats 12:35.00 correctly", () => {
      expect(getFormattedResult(75500, { noDelimiterChars: true })).toBe("123500");
    });
  });

  describe("format numbers (number format event)", () => {
    it("formats 37 correctly", () => {
      expect(getFormattedResult(37, { eventFormat: mockNumberEvent.format })).toBe("37");
    });

    it("formats 41.33 correctly", () => {
      expect(getFormattedResult(4133, { eventFormat: mockNumberEvent.format, isAverage: true })).toBe("41.33");
    });

    it("formats 40.00 correctly", () => {
      expect(getFormattedResult(4000, { eventFormat: mockNumberEvent.format, isAverage: true })).toBe("40.00");
    });

    it("formats 9.67 average correctly", () => {
      expect(getFormattedResult(967, { eventFormat: mockNumberEvent.format, isAverage: true })).toBe("9.67");
    });

    it("formats 39.66 without formatting correctly", () => {
      expect(
        getFormattedResult(3966, { eventFormat: mockNumberEvent.format, noDelimiterChars: true, isAverage: true }),
      ).toBe("3966");
    });
  });

  describe("format Multi-Blind attempts", () => {
    for (const example of multiBlindExamples) {
      it(`formats ${example.formatted} correctly`, () => {
        expect(getFormattedResult(example.result, { eventFormat: mockMultiEvent.format })).toBe(example.formatted);
      });

      it(`formats ${example.formatted} without formatting correctly`, () => {
        expect(
          getFormattedResult(example.result, {
            eventFormat: mockMultiEvent.format,
            noDelimiterChars: true,
          }),
        ).toBe(`${example.inputs.time};${example.inputs.solved};${example.inputs.attempted}`);
      });
    }

    it("formats Multi-Blind result with unknown time correctly", () => {
      expect(getFormattedResult(996386400000000, { eventFormat: mockMultiEvent.format })).toBe("36/36 Unknown time");
    });
  });

  it("formats DNF correctly", () => {
    expect(getFormattedResult(-1)).toBe("DNF");
  });

  it("formats DNS correctly", () => {
    expect(getFormattedResult(-2)).toBe("DNS");
  });

  it("formats unknown time correctly", () => {
    expect(getFormattedResult(C.maxTime)).toBe("Unknown");
  });

  it("formats Multi attempt with unknown time correctly", () => {
    const attempt = Number(`9995${C.maxTime}0001`);
    expect(getFormattedResult(attempt, { eventFormat: mockMultiEvent.format })).toBe("5/6 Unknown time");
  });

  it("formats 0:34 memo time correctly", () => {
    expect(getFormattedResult(3400, { showDecimals: "never" })).toBe("0:34");
  });

  it("formats 14:07 memo time correctly", () => {
    expect(getFormattedResult(84700, { showDecimals: "never" })).toBe("14:07");
  });

  describe("format time-3d singles", () => {
    it("formats 0.123 correctly", () => {
      expect(getFormattedResult(123, { eventFormat: mockTime3dEvent.format })).toBe("0.123");
    });

    it("formats 1.234 correctly", () => {
      expect(getFormattedResult(1234, { eventFormat: mockTime3dEvent.format })).toBe("1.234");
    });

    it("formats 2:03.456 correctly", () => {
      expect(getFormattedResult(123456, { eventFormat: mockTime3dEvent.format })).toBe("2:03.456");
    });

    it("formats 9:59.999 correctly", () => {
      expect(getFormattedResult(599999, { eventFormat: mockTime3dEvent.format })).toBe("9:59.999");
    });

    it("formats 0.000 correctly", () => {
      expect(getFormattedResult(0, { eventFormat: mockTime3dEvent.format })).toBe("?");
    });

    describe("format time-3d singles without formatting (no commas or colons)", () => {
      it("formats 0.123 without formatting correctly", () => {
        expect(getFormattedResult(123, { eventFormat: mockTime3dEvent.format, noDelimiterChars: true })).toBe("123");
      });

      it("formats 1.234 without formatting correctly", () => {
        expect(getFormattedResult(1234, { eventFormat: mockTime3dEvent.format, noDelimiterChars: true })).toBe("1234");
      });

      it("formats 12.345 without formatting correctly", () => {
        expect(getFormattedResult(12345, { eventFormat: mockTime3dEvent.format, noDelimiterChars: true })).toBe(
          "12345",
        );
      });

      it("formats 2:03.456 without formatting correctly", () => {
        expect(getFormattedResult(123456, { eventFormat: mockTime3dEvent.format, noDelimiterChars: true })).toBe(
          "203456",
        );
      });

      it("formats 10:12.345 without formatting correctly", () => {
        expect(getFormattedResult(612345, { eventFormat: mockTime3dEvent.format, noDelimiterChars: true })).toBe(
          "1012345",
        );
      });
    });
  });
});

describe(getBestAndAverage.name, () => {
  describe("time format events", () => {
    it("sets average to 0 when there is only one attempt", () => {
      const attempts: Attempt[] = [{ result: 1234 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "1");

      expect(best).toBe(1234);
      expect(average).toBe(0);
    });

    it("sets average to 0 when there are only 2 attempts", () => {
      const attempts: Attempt[] = [{ result: 1234 }, { result: 2345 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "2");

      expect(best).toBe(1234);
      expect(average).toBe(0);
    });

    it("correctly calculates best and average for Bo3", () => {
      const attempts: Attempt[] = [{ result: 1234 }, { result: 1500 }, { result: 1300 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "3");

      expect(best).toBe(1234);
      expect(average).toBe(1345);
    });

    it("correctly calculates best and average for Mo3", () => {
      const attempts: Attempt[] = [{ result: 1234 }, { result: 1500 }, { result: 1300 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "m");

      expect(best).toBe(1234);
      expect(average).toBe(1345);
    });

    it("correctly calculates best and average for Ao5", () => {
      const attempts: Attempt[] = [
        { result: 1234 },
        { result: 1500 },
        { result: 1300 },
        { result: 1100 },
        { result: 1400 },
      ];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "a");

      expect(best).toBe(1100);
      expect(average).toBe(1311);
    });

    it("correctly calculates best and average for Bo5", () => {
      const attempts: Attempt[] = [
        { result: 1234 },
        { result: 1500 },
        { result: 1300 },
        { result: 1100 },
        { result: 1400 },
      ];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "5");

      expect(best).toBe(1100);
      expect(average).toBe(1311);
    });

    it("handles DNF for Mo3", () => {
      const attempts: Attempt[] = [{ result: 1234 }, { result: -1 }, { result: 1300 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "m");

      expect(best).toBe(1234);
      expect(average).toBe(-1);
    });

    it("handles multiple DNFs for Ao5", () => {
      const attempts: Attempt[] = [
        { result: 1234 },
        { result: -1 },
        { result: 1300 },
        { result: -1 },
        { result: 1400 },
      ];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "a");

      expect(best).toBe(1234);
      expect(average).toBe(-1);
    });

    it("handles not yet entered attempts for Mo3", () => {
      const attempts: Attempt[] = [{ result: 1234 }, { result: 1300 }, { result: 0 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "m");

      expect(best).toBe(1234);
      expect(average).toBe(0);
    });

    it("handles not yet entered attempts for Ao5", () => {
      const attempts: Attempt[] = [
        { result: 1234 },
        { result: 1300 },
        { result: 1400 },
        { result: 1500 },
        { result: 0 },
      ];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "a");

      expect(best).toBe(1234);
      expect(average).toBe(0);
    });

    it("handles all DNF/DNS attempts", () => {
      const attempts: Attempt[] = [{ result: -1 }, { result: -2 }, { result: -1 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "m");

      expect(best).toBe(-1);
      expect(average).toBe(-1);
    });

    it("handles NaN attempt for Mo3 (invalid time value, like 70.00)", () => {
      const attempts: Attempt[] = [{ result: -1 }, { result: -2 }, { result: NaN }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "m");

      expect(best).toBe(-1);
      expect(average).toBe(0);
    });

    it("handles NaN attempt for Ao5 (invalid time value, like 70.00)", () => {
      const attempts: Attempt[] = [
        { result: 1234 },
        { result: 1300 },
        { result: NaN },
        { result: 1400 },
        { result: 1500 },
      ];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "a");

      expect(best).toBe(1234);
      expect(average).toBe(0);
    });

    it("handles result that doesn't make cutoff for Mo3", () => {
      // Doesn't make 15.00 Bo1 cutoff
      const attempts: Attempt[] = [{ result: 1700 }, { result: 0 }, { result: 0 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "m");

      expect(best).toBe(1700);
      expect(average).toBe(0);
    });

    it("handles result that doesn't make cutoff for Ao5 (with result that exactly matches cutoff)", () => {
      // Doesn't make 15.00 Bo2 cutoff
      const attempts: Attempt[] = [{ result: 1700 }, { result: 1500 }, { result: 0 }, { result: 0 }, { result: 0 }];

      const { best, average } = getBestAndAverage(attempts, { format: "time", higherIsBetter: false }, "a");

      expect(best).toBe(1500);
      expect(average).toBe(0);
    });
  });

  describe("number format events", () => {
    it("correctly calculates best and average for Bo3", () => {
      const attempts: Attempt[] = [{ result: 10 }, { result: 12 }, { result: 11 }];

      const { best, average } = getBestAndAverage(attempts, { format: "number", higherIsBetter: false }, "3");

      expect(best).toBe(10);
      expect(average).toBe(1100);
    });

    it("correctly calculates best and average for Ao5", () => {
      const attempts: Attempt[] = [{ result: 10 }, { result: 12 }, { result: 11 }, { result: 9 }, { result: -1 }];

      const { best, average } = getBestAndAverage(attempts, { format: "number", higherIsBetter: false }, "a");

      expect(best).toBe(9);
      expect(average).toBe(1100);
    });
  });

  describe("higher-is-better events", () => {
    it("gets the best attempt as the highest value for Bo3", () => {
      const attempts: Attempt[] = [{ result: 10 }, { result: 12 }, { result: 11 }];

      const { best, average } = getBestAndAverage(attempts, { format: "number", higherIsBetter: true }, "3");

      expect(best).toBe(12);
      expect(average).toBe(1100);
    });

    it("gets the best attempt as the highest value and excludes the best and worst from an Ao5", () => {
      const attempts: Attempt[] = [{ result: 10 }, { result: 12 }, { result: 11 }, { result: 9 }, { result: 8 }];

      const { best, average } = getBestAndAverage(attempts, { format: "number", higherIsBetter: true }, "a");

      expect(best).toBe(12);
      expect(average).toBe(1000);
    });
  });

  // TO-DO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  describe.todo("multi format events");
});

describe(compareSingles.name, () => {
  it("compares singles correctly when a < b", () => {
    expect(compareSingles({ best: 10 }, { best: 11 }, { higherIsBetter: false })).toBeLessThan(0);
  });

  it("compares singles correctly when a > b", () => {
    expect(compareSingles({ best: 10 }, { best: 9 }, { higherIsBetter: false })).toBeGreaterThan(0);
  });

  it("compares singles correctly when a = b", () => {
    expect(compareSingles({ best: 10 }, { best: 10 }, { higherIsBetter: false })).toBe(0);
  });

  it("compares singles correctly when a is DNF", () => {
    expect(compareSingles({ best: -1 }, { best: 10 }, { higherIsBetter: false })).toBeGreaterThan(0);
  });

  it("compares singles correctly when b is DNF", () => {
    expect(compareSingles({ best: 10 }, { best: -1 }, { higherIsBetter: false })).toBeLessThan(0);
  });

  it("compares singles correctly when a and b are DNF", () => {
    expect(compareSingles({ best: -1 }, { best: -1 }, { higherIsBetter: false })).toBe(0);
  });

  it("compares singles correctly when a is DNS and b is DNF", () => {
    expect(compareSingles({ best: -2 }, { best: -1 }, { higherIsBetter: false })).toBe(0);
  });

  it("compares singles correctly when a is DNF and b is DNS", () => {
    expect(compareSingles({ best: -1 }, { best: -2 }, { higherIsBetter: false })).toBe(0);
  });

  describe("compare Multi-Blind singles", () => {
    it("compares Multi-Blind singles correctly when a is 2/2 and b is 9/10", () => {
      expect(
        compareSingles({ best: 999700043890000 }, { best: 999100774000001 }, { higherIsBetter: false }),
      ).toBeGreaterThan(0);
    });

    it("compares Multi-Blind singles correctly when a is 3/3 59.68 and b is 3/3 1:05.57", () => {
      expect(
        compareSingles({ best: 999600059680000 }, { best: 999600065570000 }, { higherIsBetter: false }),
      ).toBeLessThan(0);
    });

    it("compares Multi-Blind singles correctly when a is 51/55 58:06 and b is 49/51 58:06", () => {
      expect(
        compareSingles({ best: 995203486000004 }, { best: 995203486000002 }, { higherIsBetter: false }),
      ).toBeGreaterThan(0);
    });

    it("compares Multi-Blind singles correctly when a is DNF (6/15) and b is DNF (1/2)", () => {
      expect(compareSingles({ best: -999603161000009 }, { best: -999900516420001 }, { higherIsBetter: false })).toBe(0);
    });
  });

  it("compares singles for higher-is-better event", () => {
    expect(compareSingles({ best: 10 }, { best: 11 }, { higherIsBetter: true })).toBeGreaterThan(0);
    expect(compareSingles({ best: 10 }, { best: 10 }, { higherIsBetter: true })).toBe(0);
    expect(compareSingles({ best: 11 }, { best: 10 }, { higherIsBetter: true })).toBeLessThan(0);
  });
});

describe(compareAvgs.name, () => {
  it("compares averages correctly when a < b", () => {
    expect(compareAvgs({ average: 10 }, { average: 11 }, { higherIsBetter: false })).toBeLessThan(0);
  });

  it("compares averages correctly when a > b", () => {
    expect(compareAvgs({ average: 10 }, { average: 9 }, { higherIsBetter: false })).toBeGreaterThan(0);
  });

  it("compares averages correctly when b is DNF", () => {
    expect(compareAvgs({ average: 10 }, { average: -1 }, { higherIsBetter: false })).toBeLessThan(0);
  });

  it("compares averages correctly when a is DNF", () => {
    expect(compareAvgs({ average: -1 }, { average: 10 }, { higherIsBetter: false })).toBeGreaterThan(0);
  });

  it("compares averages correctly when a and b are DNF", () => {
    expect(
      compareAvgs({ average: -1, best: 10 }, { average: -1, best: 11 }, { higherIsBetter: false, useTieBreaker: true }),
    ).toBeLessThan(0);
  });

  it("compares same averages correctly when the singles are different", () => {
    expect(
      compareAvgs({ average: 10, best: 5 }, { average: 10, best: 6 }, { higherIsBetter: false, useTieBreaker: true }),
    ).toBeLessThan(0);
  });

  it("compares same averages correctly when the singles are the same", () => {
    expect(
      compareAvgs({ average: 10, best: 5 }, { average: 10, best: 5 }, { higherIsBetter: false, useTieBreaker: true }),
    ).toBe(0);
  });

  it("compares averages for higher-is-better event", () => {
    expect(compareAvgs({ average: 10 }, { average: 11 }, { higherIsBetter: true })).toBeGreaterThan(0);
    expect(compareAvgs({ average: 11 }, { average: 10 }, { higherIsBetter: true })).toBeLessThan(0);
    expect(
      compareAvgs({ average: 10, best: 5 }, { average: 10, best: 6 }, { useTieBreaker: true, higherIsBetter: true }),
    ).toBeGreaterThan(0);
  });
});

describe(setResultWorldRecords.name, () => {
  const mock333WrPair: EventWrPair = { eventId: "333", best: 1000, average: 1100 };
  const mock222WrPair: EventWrPair = { eventId: "222", best: 124, average: 211 };
  const mockBLDWrPair: EventWrPair = { eventId: "333bf", best: 2217, average: 2795 };

  it("sets new 3x3x3 records correctly", () => {
    const event = eventsStub.find((e) => e.eventId === "333") as any as EventResponse;
    const stubResult = resultsStub.find((r) => r.eventId === "333") as any as ResultResponse;
    const result = setResultWorldRecords(stubResult, event, mock333WrPair);

    expect(result.best).toBe(686);
    expect(result.regionalSingleRecord).toBe("WR");
    expect(result.average).toBe(800);
    expect(result.regionalAverageRecord).toBe("WR");
  });

  it("updates 3x3x3 BLD single record correctly", () => {
    const event = eventsStub.find((e) => e.eventId === "333bf") as any as EventResponse;
    const stubResult = resultsStub.find((r) => r.eventId === "333bf") as any as ResultResponse;
    const result = setResultWorldRecords(stubResult, event, mockBLDWrPair);

    expect(result.regionalSingleRecord).toBe("WR");
    expect(result.regionalAverageRecord).toBeUndefined();
  });

  it("doesn't set avg records when the # of attempts doesn't match the default format's # of attempts", () => {
    const event = eventsStub.find((e) => e.eventId === "222") as any as EventResponse;
    const stubResult = resultsStub.find((r) => r.eventId === "222") as any as ResultResponse;
    const result = setResultWorldRecords(stubResult, event, mock222WrPair);

    expect(result.best).toBe(100);
    expect(result.regionalSingleRecord).toBe("WR");
    expect(result.average).toBe(101);
    expect(result.regionalAverageRecord).toBeUndefined();
  });
});
