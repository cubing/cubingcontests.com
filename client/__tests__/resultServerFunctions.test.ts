import { and, eq, ne } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  dePersonHansBauer,
  dePersonJakobBach,
  krPersonDongJunHyon,
  krPersonSooMinNam,
  usPersonJohnDoe,
} from "~/__mocks__/stubs/persons.stub.ts";
import { db } from "~/server/db/provider.ts";
import { resultsTable as table } from "~/server/db/schema/results.ts";
import { createVideoBasedResultSF, getWrPairsUpToDateSF } from "~/server/serverFunctions/resultServerFunctions.ts";

describe("getWrPairsUpToDateSF", () => {
  it.skip("gets WR pairs up to date", async () => {
    const res = await getWrPairsUpToDateSF({ recordsUpTo: new Date(2025, 0, 1) });

    expect(res.serverError).toBeUndefined();
    expect(res.validationErrors).toBeUndefined();
    expect(res.data!.length).toBeGreaterThan(0);
    expect(res.data![0].eventId).toBe("666bf");
    expect(res.data![0].best).toBe(120000);
  });
});

describe("createVideoBasedResultSF", () => {
  const date = new Date(2023, 0, 1);

  it("creates non-record result", async () => {
    const res = await createVideoBasedResultSF({
      newResultDto: {
        eventId: "444bf",
        date,
        personIds: [1],
        attempts: [{ result: 10000, memo: 50 }, { result: 10100 }, { result: 10200 }],
        videoLink: "https://example.com",
      },
    });

    expect(res.serverError).toBeUndefined();
    expect(res.validationErrors).toBeUndefined();
    expect(res.data).toBeDefined();
    expect(res.data!.countryIso2).toBe("GB");
    expect(res.data!.continentId).toBe("EUROPE");
    expect(res.data!.best).toBe(10000);
    expect(res.data!.average).toBe(10100);
    expect(res.data!.date.getTime()).toBe(date.getTime());
    expect(res.data!.regionalSingleRecord).toBeNull();
    expect(res.data!.regionalAverageRecord).toBeNull();
  });

  it("doesn't set average record for result with different average format", async () => {
    const res = await createVideoBasedResultSF({
      newResultDto: {
        eventId: "444bf",
        date,
        personIds: [1],
        attempts: [{ result: 1234 }, { result: 1234 }, { result: 1234 }, { result: 1234 }, { result: 1234 }],
        videoLink: "https://example.com",
      },
    });

    expect(res.data).toBeDefined();
    expect(res.data!.regionalAverageRecord).toBeNull();
  });

  it("throws error for invalid event ID", async () => {
    const eventId = "INVALID";
    const res = await createVideoBasedResultSF({
      newResultDto: {
        eventId,
        date,
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
        date,
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
        date,
        personIds: [1, 2],
        attempts: [{ result: 1234, memo: 12 }],
        videoLink: "https://example.com",
      },
    });

    expect(res.serverError?.message).toContain("event must have 1 participant");
    expect(res.data).toBeUndefined();
  });

  describe("Record result creation", () => {
    describe("4x4x4 Blindfolded results", () => {
      const partialResult = {
        eventId: "444bf",
        date,
        videoLink: "https://example.com",
      };

      it("creates NR result (beating FWR) and cancels future NR", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            ...partialResult,
            personIds: [usPersonJohnDoe],
            attempts: [{ result: 8800 }, { result: 8900 }, { result: 9000 }],
          },
        });

        expect(res.data).toBeDefined();
        expect(res.data!.countryIso2).toBe("US");
        expect(res.data!.regionalSingleRecord).toBe("NR");
        expect(res.data!.regionalAverageRecord).toBe("NR");

        const [cancelledNr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 0, 1)));
        expect(cancelledNr?.regionalSingleRecord).toBeNull();
        expect(cancelledNr?.regionalAverageRecord).toBeNull();
      });

      it("creates CR result (beating FWR), cancels future NR and changes future CR to NR", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            ...partialResult,
            personIds: [usPersonJohnDoe],
            attempts: [{ result: 8300 }, { result: 8400 }, { result: 8500 }],
          },
        });

        expect(res.data).toBeDefined();
        expect(res.data!.continentId).toBe("NORTH_AMERICA");
        expect(res.data!.regionalSingleRecord).toBe("NAR");
        expect(res.data!.regionalAverageRecord).toBe("NAR");

        const [cancelledNr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 0, 1)));
        expect(cancelledNr?.regionalSingleRecord).toBeNull();
        expect(cancelledNr?.regionalAverageRecord).toBeNull();
        const [crChangedToNr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 1, 1)));
        expect(crChangedToNr?.regionalSingleRecord).toBe("NR");
        expect(crChangedToNr?.regionalAverageRecord).toBe("NR");
      });

      it("creates NR result (beating FCR)", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            ...partialResult,
            personIds: [krPersonDongJunHyon],
            attempts: [{ result: 7800 }, { result: 7900 }, { result: 8000 }],
          },
        });

        expect(res.data).toBeDefined();
        expect(res.data!.countryIso2).toBe("KR");
        expect(res.data!.regionalSingleRecord).toBe("NR");
        expect(res.data!.regionalAverageRecord).toBe("NR");
      });

      it("creates NR result", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            ...partialResult,
            personIds: [dePersonHansBauer],
            attempts: [{ result: 7300 }, { result: 7400 }, { result: 7500 }],
          },
        });

        expect(res.data).toBeDefined();
        expect(res.data!.countryIso2).toBe("DE");
        expect(res.data!.regionalSingleRecord).toBe("NR");
        expect(res.data!.regionalAverageRecord).toBe("NR");
      });

      it("creates CR result and cancels future CR", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            ...partialResult,
            personIds: [krPersonSooMinNam],
            attempts: [{ result: 6800 }, { result: 6900 }, { result: 7000 }],
          },
        });

        expect(res.data).toBeDefined();
        expect(res.data!.continentId).toBe("ASIA");
        expect(res.data!.regionalSingleRecord).toBe("AsR");
        expect(res.data!.regionalAverageRecord).toBe("AsR");

        const [cancelledCr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 2, 1)));
        expect(cancelledCr?.regionalSingleRecord).toBeNull();
        expect(cancelledCr?.regionalAverageRecord).toBeNull();
      });

      it("creates WR result, cancels future WR, changes future WR to CR and changes future WR to NR", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            ...partialResult,
            personIds: [dePersonJakobBach],
            attempts: [{ result: 5000 }, { result: 5100 }, { result: 5200 }],
          },
        });

        expect(res.data).toBeDefined();
        expect(res.data!.regionalSingleRecord).toBe("WR");
        expect(res.data!.regionalAverageRecord).toBe("WR");

        const [cancelledWr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 3, 1)));
        expect(cancelledWr?.regionalSingleRecord).toBeNull();
        expect(cancelledWr?.regionalAverageRecord).toBeNull();
        const [wrChangedToCr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 4, 1)));
        expect(wrChangedToCr?.regionalSingleRecord).toBe("AsR");
        expect(wrChangedToCr?.regionalAverageRecord).toBe("AsR");
        const [wrChangedToNr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 5, 1)));
        expect(wrChangedToNr?.regionalSingleRecord).toBe("NR");
        expect(wrChangedToNr?.regionalAverageRecord).toBe("NR");
      });

      it("creates WR result, cancels future WR, changes future WR to CR and changes future CR to NR", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            ...partialResult,
            personIds: [krPersonSooMinNam],
            attempts: [{ result: 5000 }, { result: 5100 }, { result: 5200 }],
          },
        });

        expect(res.data).toBeDefined();
        expect(res.data!.regionalSingleRecord).toBe("WR");
        expect(res.data!.regionalAverageRecord).toBe("WR");

        const [cancelledCr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 2, 1)));
        expect(cancelledCr?.regionalSingleRecord).toBeNull();
        expect(cancelledCr?.regionalAverageRecord).toBeNull();
        const [wrChangedToCr1] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 3, 1)));
        expect(wrChangedToCr1?.regionalSingleRecord).toBe("ER");
        expect(wrChangedToCr1?.regionalAverageRecord).toBe("ER");
        const [wrChangedToNr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 4, 1)));
        expect(wrChangedToNr?.regionalSingleRecord).toBe("NR");
        expect(wrChangedToNr?.regionalAverageRecord).toBe("NR");
        const [wrChangedToCr2] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 5, 1)));
        expect(wrChangedToCr2?.regionalSingleRecord).toBe("ER");
        expect(wrChangedToCr2?.regionalAverageRecord).toBe("ER");
      });

      it("creates WR result, changes future WR to CR, cancels future CR and cancels future NR", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            ...partialResult,
            personIds: [usPersonJohnDoe],
            attempts: [{ result: 5000 }, { result: 5100 }, { result: 5200 }],
          },
        });

        expect(res.data).toBeDefined();
        expect(res.data!.regionalSingleRecord).toBe("WR");
        expect(res.data!.regionalAverageRecord).toBe("WR");

        const [cancelledNr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 0, 1)));
        expect(cancelledNr?.regionalSingleRecord).toBeNull();
        expect(cancelledNr?.regionalAverageRecord).toBeNull();
        const [crChangedToNr] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 1, 1)));
        expect(crChangedToNr?.regionalSingleRecord).toBe("NR");
        expect(crChangedToNr?.regionalAverageRecord).toBe("NR");
        const [wrChangedToCr1] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 3, 1)));
        expect(wrChangedToCr1?.regionalSingleRecord).toBe("ER");
        expect(wrChangedToCr1?.regionalAverageRecord).toBe("ER");
        const [wrChangedToCr2] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 4, 1)));
        expect(wrChangedToCr2?.regionalSingleRecord).toBe("AsR");
        expect(wrChangedToCr2?.regionalAverageRecord).toBe("AsR");
        const [wrChangedToCr3] = await db
          .select()
          .from(table)
          .where(eq(table.date, new Date(2025, 5, 1)));
        expect(wrChangedToCr3?.regionalSingleRecord).toBe("ER");
        expect(wrChangedToCr3?.regionalAverageRecord).toBe("ER");
      });

      describe("edge cases", () => {
        it("creates tied NR result (tying FWR)", async () => {
          const res = await createVideoBasedResultSF({
            newResultDto: {
              ...partialResult,
              personIds: [usPersonJohnDoe],
              attempts: [{ result: 9000 }, { result: 9100 }, { result: 9200 }],
            },
          });

          expect(res.data).toBeDefined();
          expect(res.data!.countryIso2).toBe("US");
          expect(res.data!.regionalSingleRecord).toBe("NR");
          expect(res.data!.regionalAverageRecord).toBe("NR");
        });

        it("creates tied NR result (tying future NR)", async () => {
          const res = await createVideoBasedResultSF({
            newResultDto: {
              ...partialResult,
              personIds: [usPersonJohnDoe],
              attempts: [{ result: 8900 }, { result: 9000 }, { result: 9100 }],
            },
          });

          expect(res.data).toBeDefined();
          expect(res.data!.countryIso2).toBe("US");
          expect(res.data!.regionalSingleRecord).toBe("NR");
          expect(res.data!.regionalAverageRecord).toBe("NR");

          const [notCancelledTiedNr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 0, 1)));
          expect(notCancelledTiedNr?.regionalSingleRecord).toBe("NR");
          expect(notCancelledTiedNr?.regionalAverageRecord).toBe("NR");
        });

        it("creates tied CR result (tying FWR) and cancels future NR", async () => {
          const res = await createVideoBasedResultSF({
            newResultDto: {
              ...partialResult,
              personIds: [usPersonJohnDoe],
              attempts: [{ result: 8500 }, { result: 8600 }, { result: 8700 }],
            },
          });

          expect(res.data).toBeDefined();
          expect(res.data!.continentId).toBe("NORTH_AMERICA");
          expect(res.data!.regionalSingleRecord).toBe("NAR");
          expect(res.data!.regionalAverageRecord).toBe("NAR");

          const [cancelledNr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 0, 1)));
          expect(cancelledNr?.regionalSingleRecord).toBeNull();
          expect(cancelledNr?.regionalAverageRecord).toBeNull();
        });

        it("creates tied CR result (tying future CR) and cancels future NR", async () => {
          const res = await createVideoBasedResultSF({
            newResultDto: {
              ...partialResult,
              personIds: [usPersonJohnDoe],
              attempts: [{ result: 8400 }, { result: 8500 }, { result: 8600 }],
            },
          });

          expect(res.data).toBeDefined();
          expect(res.data!.continentId).toBe("NORTH_AMERICA");
          expect(res.data!.regionalSingleRecord).toBe("NAR");
          expect(res.data!.regionalAverageRecord).toBe("NAR");

          const [cancelledNr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 0, 1)));
          expect(cancelledNr?.regionalSingleRecord).toBeNull();
          expect(cancelledNr?.regionalAverageRecord).toBeNull();
          const [notCancelledTiedCr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 1, 1)));
          expect(notCancelledTiedCr?.regionalSingleRecord).toBe("NAR");
          expect(notCancelledTiedCr?.regionalAverageRecord).toBe("NAR");
        });

        it("creates tied WR result, changes future CR to NR and cancels future NR", async () => {
          const res = await createVideoBasedResultSF({
            newResultDto: {
              ...partialResult,
              personIds: [usPersonJohnDoe],
              attempts: [{ result: 6500 }, { result: 6600 }, { result: 6700 }],
            },
          });

          expect(res.data).toBeDefined();
          expect(res.data!.regionalSingleRecord).toBe("WR");
          expect(res.data!.regionalAverageRecord).toBe("WR");

          const [cancelledNr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 0, 1)));
          expect(cancelledNr?.regionalSingleRecord).toBeNull();
          expect(cancelledNr?.regionalAverageRecord).toBeNull();
          const [crChangedToNr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 1, 1)));
          expect(crChangedToNr?.regionalSingleRecord).toBe("NR");
          expect(crChangedToNr?.regionalAverageRecord).toBe("NR");
        });

        it("creates tied WR result (tying future WR), changes future CR to NR and cancels future NR", async () => {
          const res = await createVideoBasedResultSF({
            newResultDto: {
              ...partialResult,
              personIds: [usPersonJohnDoe],
              attempts: [{ result: 6400 }, { result: 6500 }, { result: 6600 }],
            },
          });

          expect(res.data).toBeDefined();
          expect(res.data!.regionalSingleRecord).toBe("WR");
          expect(res.data!.regionalAverageRecord).toBe("WR");

          const [cancelledNr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 0, 1)));
          expect(cancelledNr?.regionalSingleRecord).toBeNull();
          expect(cancelledNr?.regionalAverageRecord).toBeNull();
          const [crChangedToNr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 1, 1)));
          expect(crChangedToNr?.regionalSingleRecord).toBe("NR");
          expect(crChangedToNr?.regionalAverageRecord).toBe("NR");
          const [notCancelledTiedWr] = await db
            .select()
            .from(table)
            .where(eq(table.date, new Date(2025, 3, 1)));
          expect(notCancelledTiedWr?.regionalSingleRecord).toBe("WR");
          expect(notCancelledTiedWr?.regionalAverageRecord).toBe("WR");
        });

        it("doesn't set record, when there was a better record on the same day", async () => {
          const res = await createVideoBasedResultSF({
            newResultDto: {
              ...partialResult,
              personIds: [dePersonJakobBach],
              date: new Date(2020, 5, 1), // same date as German NR by Hans Bauer
              attempts: [{ result: 7600 }, { result: 7700 }, { result: 7800 }],
            },
          });

          expect(res.data).toBeDefined();
          expect(res.data!.countryIso2).toBe("DE");
          expect(res.data!.regionalSingleRecord).toBeNull();
          expect(res.data!.regionalAverageRecord).toBeNull();
        });

        it("cancels record set on the same day with an even better record", async () => {
          const res = await createVideoBasedResultSF({
            newResultDto: {
              ...partialResult,
              personIds: [dePersonJakobBach],
              date: new Date(2020, 5, 1), // same date as German NR by Hans Bauer
              attempts: [{ result: 7200 }, { result: 7300 }, { result: 7400 }],
            },
          });

          expect(res.data).toBeDefined();
          expect(res.data!.countryIso2).toBe("DE");
          expect(res.data!.regionalSingleRecord).toBe("NR");
          expect(res.data!.regionalAverageRecord).toBe("NR");

          const [cancelledNr] = await db
            .select()
            .from(table)
            .where(and(ne(table.id, res.data!.id), eq(table.date, new Date(2020, 5, 1))));
          expect(cancelledNr?.regionalSingleRecord).toBeNull();
          expect(cancelledNr?.regionalAverageRecord).toBeNull();
        });
      });
    });

    describe.skip("3x3x3 Blindfolded 2-man Relay", () => {
      it("creates team event AsB single & average result", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            eventId: "333bf_2_person_relay",
            date: new Date(2023, 0, 1),
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

      it("creates team event NB single & average result", async () => {
        const res = await createVideoBasedResultSF({
          newResultDto: {
            eventId: "333bf_2_person_relay",
            date: new Date(2023, 0, 1),
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
});
