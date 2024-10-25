import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { IAttempt } from "~/shared_helpers/types.ts";
import { getBestAndAverage } from "~/shared_helpers/sharedFunctions.ts";
import { mockTimeEvent } from "~/__mocks__/events.stub.ts";
import { RoundFormat } from "~/shared_helpers/enums.ts";

describe("getBestAndAverage", () => {
  it("Sets average to 0 when there is only one attempt", () => {
    const attempts: IAttempt[] = [{ result: 1234 }];

    const { best, average } = getBestAndAverage(attempts, mockTimeEvent, {
      roundFormat: RoundFormat.BestOf1,
    });

    expect(best).toBe(1234);
    expect(average).toBe(0);
  });

  it("Sets average to 0 when there are only 2 attempts", () => {
    const attempts: IAttempt[] = [{ result: 1234 }, { result: 2345 }];

    const { best, average } = getBestAndAverage(attempts, mockTimeEvent, {
      roundFormat: RoundFormat.BestOf2,
    });

    expect(best).toBe(1234);
    expect(average).toBe(0);
  });
});
