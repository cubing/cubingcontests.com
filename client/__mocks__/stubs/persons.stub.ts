import type { InsertPerson } from "~/server/db/schema/persons.ts";

export const personsStub = (): InsertPerson[] => [
  {
    personId: 1,
    name: "John Doe",
    countryIso2: "GB",
    approved: true,
  },
  {
    personId: 2,
    name: "Sam Marsh",
    countryIso2: "GB",
    approved: true,
  },
  {
    personId: 3,
    name: "Hans Bauer",
    countryIso2: "DE",
    approved: true,
  },
  {
    personId: 4,
    name: "Jakob Bach",
    countryIso2: "DE",
    approved: true,
  },
  {
    personId: 5,
    name: "Satoshi Nakamura",
    countryIso2: "JP",
    approved: true,
  },
  {
    personId: 6,
    name: "Naoko Yoshida",
    countryIso2: "JP",
    approved: true,
  },
  {
    personId: 7,
    name: "Dong-Jun Hyon",
    countryIso2: "KR",
    approved: true,
  },
  {
    personId: 8,
    name: "Soo-Min Nam",
    countryIso2: "KR",
    approved: true,
  },
];
