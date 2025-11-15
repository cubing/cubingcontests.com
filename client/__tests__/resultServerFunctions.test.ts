import { describe, expect, it } from "vitest";
import { createVideoBasedResultSF, getWrPairsUpToDateSF } from "~/server/serverFunctions/resultServerFunctions.ts";

describe("getWrPairsUpToDateSF", () => {
  it.skip("gets WR pairs up to date", async () => {
    const res = await getWrPairsUpToDateSF({ recordsUpTo: new Date(2025, 0, 1) });

    console.log("TEST", res);
    expect(res.serverError).toBeUndefined();
    expect(res.validationErrors).toBeUndefined();
    expect(res.data!.length).toBeGreaterThan(0);
    expect(res.data![0].eventId).toBe("666bf");
    expect(res.data![0].best).toBe(120000);
  });
});

describe("createVideoBasedResultSF", () => {
  it("creates non-record result", async () => {
    const date = new Date(2025, 0, 1);
    const res = await createVideoBasedResultSF({
      newResultDto: {
        eventId: "444bf",
        date,
        personIds: [1],
        attempts: [{ result: 7000, memo: 30 }, { result: 8000 }, { result: 9000 }],
        videoLink: "https://example.com",
      },
    });

    expect(res.serverError).toBeUndefined();
    expect(res.validationErrors).toBeUndefined();
    expect(res.data).toBeDefined();
    expect(res.data!.countryIso2).toBe("GB");
    expect(res.data!.continentId).toBe("EUROPE");
    expect(res.data!.best).toBe(7000);
    expect(res.data!.average).toBe(8000);
    expect(res.data!.date.getTime()).toBe(date.getTime());
    expect(res.data!.regionalSingleRecord).toBeNull();
    expect(res.data!.regionalAverageRecord).toBeNull();
  });

  it("throws error for invalid event ID", async () => {
    const eventId = "INVALID";
    const res = await createVideoBasedResultSF({
      newResultDto: {
        eventId,
        date: new Date(2025, 0, 1),
        personIds: [1],
        attempts: [{ result: 1234, memo: 12 }],
        videoLink: "https://example.com",
      },
    });

    expect(res.serverError?.message).toBe(`Event with ID ${eventId} not found`);
    expect(res.data).toBeUndefined();
  });

  it("throws error for wrong number of participants (too few)", async () => {
    const res = await createVideoBasedResultSF({
      newResultDto: {
        eventId: "333_team_bld",
        date: new Date(2025, 0, 1),
        personIds: [1],
        attempts: [{ result: 1234, memo: 12 }],
        videoLink: "https://example.com",
      },
    });

    expect(res.serverError?.message).toContain("event must have 2 participants");
    expect(res.data).toBeUndefined();
  });

  it("throws error for wrong number of participants (too many)", async () => {
    const res = await createVideoBasedResultSF({
      newResultDto: {
        eventId: "444bf",
        date: new Date(2025, 0, 1),
        personIds: [1, 2],
        attempts: [{ result: 1234, memo: 12 }],
        videoLink: "https://example.com",
      },
    });

    expect(res.serverError?.message).toContain("event must have 1 participant");
    expect(res.data).toBeUndefined();
  });

  describe("Record result creation", () => {
    it("creates WR single & average result", async () => {
      const res = await createVideoBasedResultSF({
        newResultDto: {
          eventId: "444bf",
          date: new Date(2025, 0, 1),
          personIds: [1],
          attempts: [{ result: 5000 }, { result: 5500 }, { result: 6000 }],
          videoLink: "https://example.com",
        },
      });

      expect(res.data).toBeDefined();
      expect(res.data!.countryIso2).toBe("GB");
      expect(res.data!.continentId).toBe("EUROPE");
      expect(res.data!.regionalSingleRecord).toBe("WR");
      expect(res.data!.regionalAverageRecord).toBe("WR");
    });

    it("creates CR single & average result", async () => {
      const res = await createVideoBasedResultSF({
        newResultDto: {
          eventId: "444bf",
          date: new Date(2025, 0, 1),
          personIds: [5],
          attempts: [{ result: 6300 }, { result: 6500 }, { result: 6700 }],
          videoLink: "https://example.com",
        },
      });

      expect(res.data).toBeDefined();
      expect(res.data!.countryIso2).toBe("JP");
      expect(res.data!.continentId).toBe("ASIA");
      expect(res.data!.regionalSingleRecord).toBe("AsR");
      expect(res.data!.regionalAverageRecord).toBe("AsR");
    });

    it("creates NR single & average result", async () => {
      const res = await createVideoBasedResultSF({
        newResultDto: {
          eventId: "444bf",
          date: new Date(2025, 0, 1),
          personIds: [7],
          attempts: [{ result: 6800 }, { result: 7100 }, { result: 7400 }],
          videoLink: "https://example.com",
        },
      });

      expect(res.data).toBeDefined();
      expect(res.data!.countryIso2).toBe("KR");
      expect(res.data!.continentId).toBe("ASIA");
      expect(res.data!.regionalSingleRecord).toBe("NR");
      expect(res.data!.regionalAverageRecord).toBe("NR");
    });

    it("creates team event CR single & average result", async () => {
      const res = await createVideoBasedResultSF({
        newResultDto: {
          eventId: "333bf_2_person_relay",
          date: new Date(2025, 0, 1),
          personIds: [5, 7],
          attempts: [{ result: 4000 }, { result: 4100 }, { result: 4200 }],
          videoLink: "https://example.com",
        },
      });

      expect(res.data).toBeDefined();
      expect(res.data!.countryIso2).toBeNull();
      expect(res.data!.continentId).toBe("ASIA");
      expect(res.data!.regionalSingleRecord).toBe("AsR");
      expect(res.data!.regionalAverageRecord).toBe("AsR");
    });

    it("creates team event NR single & average result", async () => {
      const res = await createVideoBasedResultSF({
        newResultDto: {
          eventId: "333bf_2_person_relay",
          date: new Date(2025, 0, 1),
          personIds: [7, 8],
          attempts: [{ result: 4300 }, { result: 4500 }, { result: 4700 }],
          videoLink: "https://example.com",
        },
      });

      expect(res.data).toBeDefined();
      expect(res.data!.countryIso2).toBe("KR");
      expect(res.data!.continentId).toBe("ASIA");
      expect(res.data!.regionalSingleRecord).toBe("NR");
      expect(res.data!.regionalAverageRecord).toBe("NR");
    });
  });
});
