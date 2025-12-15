import type { InsertPerson } from "~/server/db/schema/persons.ts";

export const personsStub: InsertPerson[] = [
  {
    name: "Tom Dillon",
    regionCode: "GB",
    approved: true,
  },
  {
    name: "Sam Marsh",
    regionCode: "GB",
    approved: true,
  },
  {
    name: "Hans Bauer",
    regionCode: "DE",
    approved: true,
  },
  {
    name: "Jakob Bach",
    regionCode: "DE",
    approved: true,
  },
  {
    name: "Naoko Yoshida",
    regionCode: "JP",
    approved: true,
  },
  {
    name: "Satoshi Nakamura",
    regionCode: "JP",
    approved: true,
  },
  {
    name: "Dong-Jun Hyon",
    regionCode: "KR",
    approved: true,
  },
  {
    name: "Soo-Min Nam",
    regionCode: "KR",
    approved: true,
  },
  {
    name: "John Doe",
    regionCode: "US",
    approved: true,
  },
  {
    name: "Josh Calhoun",
    regionCode: "CA",
    approved: true,
  },
];

export const gbPersonTomDillon = personsStub.findIndex((p) => p.name === "Tom Dillon")! + 1;
export const gbPersonSamMarsh = personsStub.findIndex((p) => p.name === "Sam Marsh")! + 1;
export const dePersonHansBauer = personsStub.findIndex((p) => p.name === "Hans Bauer")! + 1;
export const dePersonJakobBach = personsStub.findIndex((p) => p.name === "Jakob Bach")! + 1;
export const jpPersonNaokoYoshida = personsStub.findIndex((p) => p.name === "Naoko Yoshida")! + 1;
export const jpPersonSatoshiNakamura = personsStub.findIndex((p) => p.name === "Satoshi Nakamura")! + 1;
export const krPersonDongJunHyon = personsStub.findIndex((p) => p.name === "Dong-Jun Hyon")! + 1;
export const krPersonSooMinNam = personsStub.findIndex((p) => p.name === "Soo-Min Nam")! + 1;
export const usPersonJohnDoe = personsStub.findIndex((p) => p.name === "John Doe")! + 1;
export const caPersonJoshCalhoun = personsStub.findIndex((p) => p.name === "Josh Calhoun")! + 1;
