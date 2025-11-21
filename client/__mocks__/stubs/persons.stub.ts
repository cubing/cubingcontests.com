import type { InsertPerson } from "~/server/db/schema/persons.ts";

export const personsStub: InsertPerson[] = [
  {
    personId: 1,
    name: "Tom Dillon",
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
    name: "Naoko Yoshida",
    countryIso2: "JP",
    approved: true,
  },
  {
    personId: 6,
    name: "Satoshi Nakamura",
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
  {
    personId: 9,
    name: "John Doe",
    countryIso2: "US",
    approved: true,
  },
  {
    personId: 10,
    name: "Josh Calhoun",
    countryIso2: "CA",
    approved: true,
  },
];

export const gbPersonTomDillon = personsStub.find((p) => p.name === "Tom Dillon")!.personId!;
export const gbPersonSamMarsh = personsStub.find((p) => p.name === "Sam Marsh")!.personId!;
export const dePersonHansBauer = personsStub.find((p) => p.name === "Hans Bauer")!.personId!;
export const dePersonJakobBach = personsStub.find((p) => p.name === "Jakob Bach")!.personId!;
export const jpPersonNaokoYoshida = personsStub.find((p) => p.name === "Naoko Yoshida")!.personId!;
export const jpPersonSatoshiNakamura = personsStub.find((p) => p.name === "Satoshi Nakamura")!.personId!;
export const krPersonDongJunHyon = personsStub.find((p) => p.name === "Dong-Jun Hyon")!.personId!;
export const krPersonSooMinNam = personsStub.find((p) => p.name === "Soo-Min Nam")!.personId!;
export const usPersonJohnDoe = personsStub.find((p) => p.name === "John Doe")!.personId!;
export const caPersonJoshCalhoun = personsStub.find((p) => p.name === "Josh Calhoun")!.personId!;
