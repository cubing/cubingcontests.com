import { setRankings, setRoundRankings } from "./utilityFunctions";
import { RoundDocument } from "../models/round.model";
import { ResultDocument } from "../models/result.model";
import { unrankedRoundsStub } from "../modules/contests/tests/stubs/unranked-rounds";
import { getRoundRanksWithAverage } from "@sh/sharedFunctions";

describe("setRoundRankings works correctly", () => {
  const unrankedRounds = unrankedRoundsStub() as RoundDocument[];

  it("sets rankings for 3x3x3 round correctly", async () => {
    const round = unrankedRounds[0];
    round.results = await setRoundRankings(round.results, getRoundRanksWithAverage(round.format));

    expect(round.results[0].ranking).toBe(1);
    expect(round.results[0].average).toBe(1170);
    expect(round.results[1].ranking).toBe(2);
    expect(round.results[1].average).toBe(1307);
    expect(round.results[2].ranking).toBe(3);
    expect(round.results[2].average).toBe(1351);
    expect(round.results[3].ranking).toBe(4);
    expect(round.results[3].average).toBe(1624);
  });

  it("sets rankings for 3x3x3 FM round correctly", async () => {
    const round = unrankedRounds[1];
    round.results = await setRoundRankings(round.results, getRoundRanksWithAverage(round.format));

    // The first two results are tied, the last two have tied means, but there is a tie-breaker
    expect(round.results[0].ranking).toBe(1);
    expect(round.results[0].average).toBe(40);
    expect(round.results[0].best).toBe(37);
    expect(round.results[1].ranking).toBe(1);
    expect(round.results[1].average).toBe(40);
    expect(round.results[1].best).toBe(37);
    expect(round.results[2].ranking).toBe(3);
    expect(round.results[2].average).toBe(43);
    expect(round.results[2].best).toBe(39);
    expect(round.results[3].ranking).toBe(4);
    expect(round.results[3].average).toBe(43);
    expect(round.results[3].best).toBe(40);
  });

  it("sets rankings for 3x3x3 BLD round correctly", async () => {
    const round = unrankedRounds[2];
    round.results = await setRoundRankings(round.results, getRoundRanksWithAverage(round.format));

    expect(round.results[0].ranking).toBe(1);
    expect(round.results[0].best).toBe(1938);
    // These two results are tied
    expect(round.results[1].ranking).toBe(2);
    expect(round.results[1].best).toBe(2482);
    expect(round.results[2].ranking).toBe(2);
    expect(round.results[2].best).toBe(2482);
    expect(round.results[3].ranking).toBe(4);
    expect(round.results[3].best).toBe(4124);
    // These two triple DNF results are tied
    expect(round.results[4].ranking).toBe(5);
    expect(round.results[4].best).toBe(-1);
    expect(round.results[5].ranking).toBe(5);
    expect(round.results[5].best).toBe(-1);
  });

  it("sets rankings for 2x2x2 round with Bo3 format correctly", async () => {
    const round = unrankedRounds[3];
    round.results = await setRoundRankings(round.results, getRoundRanksWithAverage(round.format));

    expect(round.results[0].ranking).toBe(1);
    expect(round.results[0].best).toBe(221);
    expect(round.results[1].ranking).toBe(2);
    expect(round.results[1].best).toBe(335);
    expect(round.results[2].ranking).toBe(3);
    expect(round.results[2].best).toBe(449);
  });

  it("sets rankings for 5x5x5 round with only DNF averages correctly", async () => {
    const round = unrankedRounds[4];
    round.results = await setRoundRankings(round.results, getRoundRanksWithAverage(round.format));

    expect(round.results[0].ranking).toBe(1);
    expect(round.results[0].best).toBe(3845);
    expect(round.results[0].average).toBe(-1);
    expect(round.results[1].ranking).toBe(2);
    expect(round.results[1].best).toBe(4913);
    expect(round.results[1].average).toBe(-1);
  });
});

describe("setRankings works correctly", () => {
  it("sets rankings for 3x3x3 top single results (pre-sorted) correctly", async () => {
    const top333SingleRankings = await setRankings(
      [
        { best: 467 },
        { best: 494 },
        { best: 545 },
        { best: 547 },
        { best: 552 },
        { best: 555 },
        { best: 555 },
        { best: 573 },
        { best: 590 },
        { best: 590 },
      ] as ResultDocument[],
      false,
    );

    expect(top333SingleRankings[0].ranking).toBe(1);
    expect(top333SingleRankings[1].ranking).toBe(2);
    expect(top333SingleRankings[2].ranking).toBe(3);
    expect(top333SingleRankings[3].ranking).toBe(4);
    expect(top333SingleRankings[4].ranking).toBe(5);
    expect(top333SingleRankings[5].ranking).toBe(6);
    expect(top333SingleRankings[6].ranking).toBe(6);
    expect(top333SingleRankings[7].ranking).toBe(8);
    expect(top333SingleRankings[8].ranking).toBe(9);
    expect(top333SingleRankings[9].ranking).toBe(9);
  });

  it("sets rankings for 3x3x3 top average results (pre-sorted) without tie breakers correctly", async () => {
    const top333SingleRankings = await setRankings(
      [
        { average: 467 },
        { average: 494 },
        // It shouldn't matter that the first one has a better single, these should just be tied
        { average: 545, best: 343 },
        { average: 545, best: 435 },
        { average: 552 },
        { average: 555 },
      ] as ResultDocument[],
      true,
    );

    expect(top333SingleRankings[0].ranking).toBe(1);
    expect(top333SingleRankings[1].ranking).toBe(2);
    expect(top333SingleRankings[2].ranking).toBe(3);
    expect(top333SingleRankings[3].ranking).toBe(3);
    expect(top333SingleRankings[4].ranking).toBe(5);
    expect(top333SingleRankings[5].ranking).toBe(6);
  });
});
