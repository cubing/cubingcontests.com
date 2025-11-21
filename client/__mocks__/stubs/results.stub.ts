import { Countries } from "~/helpers/Countries.ts";
import type { Attempt, InsertResult } from "~/server/db/schema/results.ts";
import {
  caPersonJoshCalhoun,
  dePersonHansBauer,
  dePersonJakobBach,
  gbPersonSamMarsh,
  gbPersonTomDillon,
  jpPersonNaokoYoshida,
  jpPersonSatoshiNakamura,
  krPersonDongJunHyon,
  krPersonSooMinNam,
  usPersonJohnDoe,
} from "./persons.stub.ts";

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
      const countryIso2 = personCountryMap[personId];

      const attemptCounts = [1, 2, 3, 5];
      const numAttempts = attemptCounts[Math.floor(Math.random() * attemptCounts.length)];
      // We want all attempts to be slower than any potential record attempt
      const firstAttempt = Math.floor(Math.random() * 9000) + 10000;
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
        countryIso2,
        continentId: Countries.find((c) => c.code === countryIso2)!.continentId,
        best,
        average,
        attempts,
        videoLink: "https://example.com",
      });
    }
  }

  return results;
};

export const resultsStub: InsertResult[] = [
  ...generateRandomResults(),

  // 4x4x4 Blindfolded
  // 2020 results
  {
    eventId: "444bf",
    date: new Date(2020, 0, 1), // January 1st
    personIds: [usPersonJohnDoe],
    countryIso2: "US",
    continentId: "NORTH_AMERICA",
    best: 9000,
    average: 9100,
    attempts: [{ result: 9000 }, { result: 9100 }, { result: 9200 }],
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 1, 1), // February 1st
    personIds: [caPersonJoshCalhoun],
    countryIso2: "CA",
    continentId: "NORTH_AMERICA",
    best: 8500,
    average: 8600,
    attempts: [{ result: 8500 }, { result: 8600 }, { result: 8700 }],
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 2, 1), // March 1st
    personIds: [gbPersonTomDillon],
    countryIso2: "GB",
    continentId: "EUROPE",
    best: 6500,
    average: 6600,
    attempts: [{ result: 6500 }, { result: 6600 }, { result: 6700 }],
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 3, 1), // April 1st
    personIds: [krPersonDongJunHyon],
    countryIso2: "KR",
    continentId: "ASIA",
    best: 8000,
    average: 8100,
    attempts: [{ result: 8000 }, { result: 8100 }, { result: 8200 }],
    regionalSingleRecord: "AsR",
    regionalAverageRecord: "AsR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 4, 1), // May 1st
    personIds: [jpPersonNaokoYoshida],
    countryIso2: "JP",
    continentId: "ASIA",
    best: 7000,
    average: 7100,
    attempts: [{ result: 7000 }, { result: 7100 }, { result: 7200 }],
    regionalSingleRecord: "AsR",
    regionalAverageRecord: "AsR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2020, 5, 1), // June 1st
    personIds: [dePersonHansBauer],
    countryIso2: "DE",
    continentId: "EUROPE",
    best: 7500,
    average: 7600,
    attempts: [{ result: 7500 }, { result: 7600 }, { result: 7700 }],
    regionalSingleRecord: "NR",
    regionalAverageRecord: "NR",
    videoLink: "https://example.com",
  },
  // 2025 results
  {
    eventId: "444bf",
    date: new Date(2025, 0, 1), // January 1st
    personIds: [usPersonJohnDoe],
    countryIso2: "US",
    continentId: "NORTH_AMERICA",
    best: 8900,
    average: 9000,
    attempts: [{ result: 8900 }, { result: 9000 }, { result: 9100 }],
    regionalSingleRecord: "NR",
    regionalAverageRecord: "NR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 1, 1), // February 1st
    personIds: [caPersonJoshCalhoun],
    countryIso2: "CA",
    continentId: "NORTH_AMERICA",
    best: 8400,
    average: 8500,
    attempts: [{ result: 8400 }, { result: 8500 }, { result: 8600 }],
    regionalSingleRecord: "NAR",
    regionalAverageRecord: "NAR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 2, 1), // March 1st
    personIds: [krPersonDongJunHyon],
    countryIso2: "KR",
    continentId: "ASIA",
    best: 6900,
    average: 7000,
    attempts: [{ result: 6900 }, { result: 7000 }, { result: 7100 }],
    regionalSingleRecord: "AsR",
    regionalAverageRecord: "AsR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 3, 1), // April 1st
    personIds: [dePersonJakobBach],
    countryIso2: "DE",
    continentId: "EUROPE",
    best: 6400,
    average: 6500,
    attempts: [{ result: 6400 }, { result: 6500 }, { result: 6600 }],
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 4, 1), // May 1st
    personIds: [jpPersonNaokoYoshida],
    countryIso2: "JP",
    continentId: "ASIA",
    best: 6000,
    average: 6100,
    attempts: [{ result: 6000 }, { result: 6100 }, { result: 6200 }],
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },
  {
    eventId: "444bf",
    date: new Date(2025, 5, 1), // June 1st
    personIds: [gbPersonSamMarsh],
    countryIso2: "GB",
    continentId: "EUROPE",
    best: 5500,
    average: 5600,
    attempts: [{ result: 5500 }, { result: 5600 }, { result: 5700 }],
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "https://example.com",
  },

  // 3x3x3 Blindfolded 2-man Relay
  // 2020 results
  {
    eventId: "333bf_2_person_relay",
    date: new Date(2020, 0, 1),
    personIds: [gbPersonTomDillon, dePersonHansBauer],
    continentId: "EUROPE",
    best: 3800,
    average: 3900,
    attempts: [{ result: 3800 }, { result: 3900 }, { result: 4000 }],
    regionalSingleRecord: "WR",
    regionalAverageRecord: "WR",
    videoLink: "www.example.com",
  },
  {
    eventId: "333bf_2_person_relay",
    date: new Date(2020, 1, 1),
    personIds: [jpPersonNaokoYoshida, jpPersonSatoshiNakamura],
    countryIso2: "JP",
    continentId: "ASIA",
    best: 4200,
    average: 4400,
    attempts: [{ result: 4200 }, { result: 4400 }, { result: 4600 }],
    regionalSingleRecord: "AsR",
    regionalAverageRecord: "AsR",
    videoLink: "www.example.com",
  },
  {
    eventId: "333bf_2_person_relay",
    date: new Date(2020, 2, 1),
    personIds: [krPersonDongJunHyon, krPersonSooMinNam],
    countryIso2: "KR",
    continentId: "ASIA",
    best: 4500,
    average: 4600,
    attempts: [{ result: 4500 }, { result: 4600 }, { result: 4700 }],
    regionalSingleRecord: "NR",
    regionalAverageRecord: "NR",
    videoLink: "www.example.com",
  },
];
