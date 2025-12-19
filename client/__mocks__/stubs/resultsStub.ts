import { Countries } from "~/helpers/Countries.ts";
import { RecordCategoryValues } from "~/helpers/types.ts";
import type { Attempt, InsertResult } from "~/server/db/schema/results.ts";
import {
  caPersonJoshCalhoun,
  dePersonHansBauer,
  dePersonJakobBach,
  dePersonStefanSteinmeier,
  gbPersonJamesStone,
  gbPersonSamMarsh,
  gbPersonTomDillon,
  jpPersonNaokoYoshida,
  jpPersonSatoshiNakamura,
  krPersonDongJunHyon,
  krPersonSooMinNam,
  usPersonJohnDoe,
} from "./personsStub.ts";
import {
  testComp2023_222_r1,
  testComp2023_333_r1,
  testComp2023_333bf_r1,
  testComp2023_444bf_r1,
  testCompApr2025_333_oh_bld_team_relay_r1,
  testCompFeb2020_333_oh_bld_team_relay_r1,
  testCompFeb2025_333_oh_bld_team_relay_r1,
  testCompJan2020_333_oh_bld_team_relay_r1,
  testCompJan2025_333_oh_bld_team_relay_r1,
  testCompMar2020_333_oh_bld_team_relay_r1,
  testCompMar2025_333_oh_bld_team_relay_r1,
  testMeetup2020_555bf_r1,
} from "./roundsStub.ts";

const personCountryMap: Record<number, string> = {
  1: "GB",
  2: "GB",
  3: "DE",
  4: "DE",
  5: "JP",
  6: "JP",
  7: "KR",
  8: "KR",
  9: "US",
  10: "CA",
};
const years = [2021, 2024, 2026];
const resultsPerYear = 50;

const generateRandomResults = (): InsertResult[] => {
  const results: InsertResult[] = [];

  for (const year of years) {
    for (let i = 0; i < resultsPerYear; i++) {
      const randomMonth = Math.floor(Math.random() * 12);
      const randomDay = Math.floor(Math.random() * 28) + 1;
      const date = new Date(year, randomMonth, randomDay);
      const personId = Math.floor(Math.random() * 10) + 1;
      const regionCode = personCountryMap[personId];
      const recordCategory = RecordCategoryValues[Math.floor(Math.random() * 3)];
      const isVideoBasedResult = recordCategory === "video-based-results";

      const attemptCounts = [1, 2, 3, 5];
      const numAttempts = attemptCounts[Math.floor(Math.random() * attemptCounts.length)];
      // We want all attempts to be slower than any potential record attempt
      const firstAttempt = Math.floor(Math.random() * 90 * 100) + 100 * 100; // 100-190 seconds
      const attempts: Attempt[] = [];
      for (let j = 0; j < numAttempts; j++) attempts.push({ result: firstAttempt + j * 100 });

      const best = firstAttempt;
      let average: number;
      if (numAttempts === 1 || numAttempts === 2) average = 0;
      else average = attempts[numAttempts === 3 ? 1 : 2].result; // average is the middle attempt result

      results.push({
        eventId: "444bf",
        date,
        personIds: [personId],
        regionCode,
        superRegionCode: Countries.find((c) => c.code === regionCode)!.superRegionCode,
        attempts,
        best,
        average,
        recordCategory,
        competitionId: isVideoBasedResult ? null : "TestComp2023",
        roundId: isVideoBasedResult ? null : testComp2023_444bf_r1,
        ranking: isVideoBasedResult ? null : 1, // doesn't matter for tests using these random results
        videoLink: isVideoBasedResult ? "https://example.com" : null,
      });
    }
  }

  return results;
};

export const resultsStub: InsertResult[] = [
  ...generateRandomResults(),

  // 3x3x3 + OH + BLD Team Relay (contest results)
  // 2020 results
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2020, 0, 1), // January 1st
    personIds: [jpPersonSatoshiNakamura, krPersonSooMinNam, dePersonHansBauer],
    attempts: [{ result: 6000 }, { result: 6100 }, { result: 6200 }],
    best: 6000,
    average: 6100,
    recordCategory: "competitions",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    competitionId: "TestCompJan2020",
    roundId: testCompJan2020_333_oh_bld_team_relay_r1,
    ranking: 1,
  },
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2020, 1, 1), // February 1st
    personIds: [gbPersonSamMarsh, dePersonHansBauer, dePersonJakobBach],
    superRegionCode: "EUROPE",
    attempts: [{ result: 6500 }, { result: 6600 }, { result: 6700 }],
    best: 6500,
    average: 6600,
    recordCategory: "competitions",
    regionalSingleRecord: "ER",
    regionalAverageRecord: "ER",
    competitionId: "TestCompFeb2020",
    roundId: testCompFeb2020_333_oh_bld_team_relay_r1,
    ranking: 1,
  },
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2020, 2, 1), // March 1st
    personIds: [gbPersonSamMarsh, gbPersonTomDillon, gbPersonJamesStone],
    regionCode: "GB",
    superRegionCode: "EUROPE",
    attempts: [{ result: 6800 }, { result: 6900 }, { result: 7000 }],
    best: 6800,
    average: 6900,
    recordCategory: "competitions",
    regionalSingleRecord: "NR",
    regionalAverageRecord: "NR",
    competitionId: "TestCompMar2020",
    roundId: testCompMar2020_333_oh_bld_team_relay_r1,
    ranking: 1,
  },
  // 3x3x3 + OH + BLD Team Relay (contest results)
  // 2025 results
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2025, 0, 1), // January 1st
    personIds: [dePersonStefanSteinmeier, gbPersonTomDillon, gbPersonJamesStone],
    superRegionCode: "EUROPE",
    attempts: [{ result: 6400 }, { result: 6500 }, { result: 6600 }],
    best: 6400,
    average: 6500,
    recordCategory: "competitions",
    regionalSingleRecord: "ER",
    regionalAverageRecord: "ER",
    competitionId: "TestCompJan2025",
    roundId: testCompJan2025_333_oh_bld_team_relay_r1,
    ranking: 1,
  },
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2025, 0, 1), // January 1st
    personIds: [gbPersonSamMarsh, gbPersonTomDillon, gbPersonJamesStone],
    regionCode: "GB",
    superRegionCode: "EUROPE",
    attempts: [{ result: 6700 }, { result: 6800 }, { result: 6900 }],
    best: 6700,
    average: 6800,
    recordCategory: "competitions",
    regionalSingleRecord: "NR",
    regionalAverageRecord: "NR",
    competitionId: "TestCompJan2025",
    roundId: testCompJan2025_333_oh_bld_team_relay_r1,
    ranking: 2,
  },
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2025, 1, 1), // February 1st
    personIds: [jpPersonNaokoYoshida, krPersonDongJunHyon, usPersonJohnDoe],
    attempts: [{ result: 5900 }, { result: 6000 }, { result: 6100 }],
    best: 5900,
    average: 6000,
    recordCategory: "competitions",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    competitionId: "TestCompFeb2025",
    roundId: testCompFeb2025_333_oh_bld_team_relay_r1,
    ranking: 1,
  },
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2025, 1, 1), // February 1st
    personIds: [gbPersonSamMarsh, gbPersonTomDillon, gbPersonJamesStone],
    regionCode: "GB",
    superRegionCode: "EUROPE",
    attempts: [{ result: 6300 }, { result: 6400 }, { result: 6500 }],
    best: 6300,
    average: 6400,
    recordCategory: "competitions",
    regionalSingleRecord: "ER",
    regionalAverageRecord: "ER",
    competitionId: "TestCompFeb2025",
    roundId: testCompFeb2025_333_oh_bld_team_relay_r1,
    ranking: 2,
  },
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2025, 2, 1), // March 1st
    personIds: [gbPersonJamesStone, dePersonHansBauer, gbPersonTomDillon],
    superRegionCode: "EUROPE",
    attempts: [{ result: 5800 }, { result: 5900 }, { result: 6000 }],
    best: 5800,
    average: 5900,
    recordCategory: "competitions",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    competitionId: "TestCompMar2025",
    roundId: testCompMar2025_333_oh_bld_team_relay_r1,
    ranking: 1,
  },
  {
    eventId: "333_oh_bld_team_relay",
    date: new Date(2025, 3, 1), // April 1st
    personIds: [gbPersonJamesStone, gbPersonSamMarsh, gbPersonTomDillon],
    regionCode: "GB",
    superRegionCode: "EUROPE",
    attempts: [{ result: 5700 }, { result: 5800 }, { result: 5900 }],
    best: 5700,
    average: 5800,
    recordCategory: "competitions",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    competitionId: "TestCompApr2025",
    roundId: testCompApr2025_333_oh_bld_team_relay_r1,
    ranking: 1,
  },

  // 4x4x4 Blindfolded (video-based)
  // 2020 results
  {
    eventId: "444bf",
    date: new Date(2020, 0, 1), // January 1st
    personIds: [usPersonJohnDoe],
    regionCode: "US",
    superRegionCode: "NORTH_AMERICA",
    attempts: [{ result: 9000 }, { result: 9100 }, { result: 9200 }],
    best: 9000,
    average: 9100,
    recordCategory: "video-based-results",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 1, 1), // February 1st
    personIds: [caPersonJoshCalhoun],
    regionCode: "CA",
    superRegionCode: "NORTH_AMERICA",
    attempts: [{ result: 8500 }, { result: 8600 }, { result: 8700 }],
    best: 8500,
    average: 8600,
    recordCategory: "video-based-results",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 2, 1), // March 1st
    personIds: [gbPersonTomDillon],
    regionCode: "GB",
    superRegionCode: "EUROPE",
    attempts: [{ result: 6500 }, { result: 6600 }, { result: 6700 }],
    best: 6500,
    average: 6600,
    recordCategory: "video-based-results",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 3, 1), // April 1st
    personIds: [krPersonDongJunHyon],
    regionCode: "KR",
    superRegionCode: "ASIA",
    attempts: [{ result: 8000 }, { result: 8100 }, { result: 8200 }],
    best: 8000,
    average: 8100,
    recordCategory: "video-based-results",
    regionalSingleRecord: "AsR",
    regionalAverageRecord: "AsR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 4, 1), // May 1st
    personIds: [jpPersonNaokoYoshida],
    regionCode: "JP",
    superRegionCode: "ASIA",
    attempts: [{ result: 7000 }, { result: 7100 }, { result: 7200 }],
    best: 7000,
    average: 7100,
    recordCategory: "video-based-results",
    regionalSingleRecord: "AsR",
    regionalAverageRecord: "AsR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 5, 1), // June 1st
    personIds: [dePersonHansBauer],
    regionCode: "DE",
    superRegionCode: "EUROPE",
    attempts: [{ result: 7500 }, { result: 7600 }, { result: 7700 }],
    best: 7500,
    average: 7600,
    recordCategory: "video-based-results",
    regionalSingleRecord: "NR",
    regionalAverageRecord: "NR",
    videoLink: "https://example.com",
  },
  // 4x4x4 Blindfolded (video-based)
  // 2025 results
  {
    eventId: "444bf",
    date: new Date(2025, 0, 1), // January 1st
    personIds: [usPersonJohnDoe],
    regionCode: "US",
    superRegionCode: "NORTH_AMERICA",
    attempts: [{ result: 8900 }, { result: 9000 }, { result: 9100 }],
    best: 8900,
    average: 9000,
    recordCategory: "video-based-results",
    regionalSingleRecord: "NR",
    regionalAverageRecord: "NR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 1, 1), // February 1st
    personIds: [caPersonJoshCalhoun],
    regionCode: "CA",
    superRegionCode: "NORTH_AMERICA",
    attempts: [{ result: 8400 }, { result: 8500 }, { result: 8600 }],
    best: 8400,
    average: 8500,
    recordCategory: "video-based-results",
    regionalSingleRecord: "NAR",
    regionalAverageRecord: "NAR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 2, 1), // March 1st
    personIds: [krPersonDongJunHyon],
    regionCode: "KR",
    superRegionCode: "ASIA",
    attempts: [{ result: 6900 }, { result: 7000 }, { result: 7100 }],
    best: 6900,
    average: 7000,
    recordCategory: "video-based-results",
    regionalSingleRecord: "AsR",
    regionalAverageRecord: "AsR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 3, 1), // April 1st
    personIds: [dePersonJakobBach],
    regionCode: "DE",
    superRegionCode: "EUROPE",
    attempts: [{ result: 6400 }, { result: 6500 }, { result: 6600 }],
    best: 6400,
    average: 6500,
    recordCategory: "video-based-results",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 4, 1), // May 1st
    personIds: [jpPersonNaokoYoshida],
    regionCode: "JP",
    superRegionCode: "ASIA",
    attempts: [{ result: 6000 }, { result: 6100 }, { result: 6200 }],
    best: 6000,
    average: 6100,
    recordCategory: "video-based-results",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 5, 1), // June 1st
    personIds: [gbPersonSamMarsh],
    regionCode: "GB",
    superRegionCode: "EUROPE",
    attempts: [{ result: 5500 }, { result: 5600 }, { result: 5700 }],
    best: 5500,
    average: 5600,
    recordCategory: "video-based-results",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },

  // Other results
  {
    // Real result from Cubing Contests
    eventId: "333",
    date: new Date(2023, 5, 30), // June 30th, 2023
    personIds: [9], // Oliver Fritz
    regionCode: "DE",
    superRegionCode: "EUROPE",
    attempts: [{ result: 876 }, { result: 989 }, { result: 812 }, { result: 711 }, { result: 686 }],
    best: 686,
    average: 800,
    recordCategory: "meetups",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    competitionId: "Munich30062023",
    roundId: testComp2023_333_r1,
    ranking: 1,
  },
  {
    eventId: "222",
    date: new Date(2023, 0, 1),
    personIds: [1],
    regionCode: "IRRELEVANT",
    attempts: [{ result: 100 }, { result: 101 }, { result: 102 }],
    best: 100,
    average: 101,
    recordCategory: "competitions",
    regionalSingleRecord: "WR",
    competitionId: "TestComp2023",
    roundId: testComp2023_222_r1,
    ranking: 1,
  },
  {
    eventId: "333bf",
    date: new Date(2023, 0, 1),
    personIds: [1],
    regionCode: "IRRELEVANT",
    attempts: [{ result: -1 }, { result: 2000 }, { result: -1 }],
    best: 2000,
    average: -1,
    recordCategory: "competitions",
    regionalSingleRecord: "WR",
    competitionId: "TestComp2023",
    roundId: testComp2023_333bf_r1,
    ranking: 1,
  },
  {
    eventId: "444bf",
    date: new Date(2023, 0, 1), // January 1st, 2023
    personIds: [1],
    regionCode: "IRRELEVANT",
    attempts: [{ result: 7500 }, { result: 7600 }, { result: 7700 }],
    best: 7500,
    average: 7600,
    recordCategory: "competitions",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    competitionId: "TestComp2023",
    roundId: testComp2023_444bf_r1,
    ranking: 1,
  },
  {
    eventId: "444bf",
    date: new Date(2020, 0, 1), // January 1st, 2020
    personIds: [1],
    regionCode: "IRRELEVANT",
    attempts: [{ result: 7000 }, { result: 7100 }, { result: 7200 }],
    best: 7000,
    average: 7100,
    recordCategory: "meetups",
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    competitionId: "TestMeetup2020",
    roundId: testMeetup2020_555bf_r1,
    ranking: 1,
  },
];
