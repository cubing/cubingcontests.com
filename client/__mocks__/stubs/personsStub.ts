import type { InsertPerson } from "~/server/db/schema/persons.ts";

// All set to approved at the bottom
export const personsStub: InsertPerson[] = [
  {
    name: "Tom Dillon",
    regionCode: "GB",
  },
  {
    name: "Sam Marsh",
    regionCode: "GB",
  },
  {
    name: "James Stone",
    regionCode: "GB",
  },
  {
    name: "Hans Bauer",
    regionCode: "DE",
  },
  {
    name: "Jakob Bach",
    regionCode: "DE",
  },
  {
    name: "Stefan Steinmeier",
    regionCode: "DE",
  },
  {
    name: "Naoko Yoshida",
    regionCode: "JP",
  },
  {
    name: "Satoshi Nakamura",
    regionCode: "JP",
  },
  {
    name: "Dong-Jun Hyon",
    regionCode: "KR",
  },
  {
    name: "Soo-Min Nam",
    regionCode: "KR",
  },
  {
    name: "John Doe",
    regionCode: "US",
  },
  {
    name: "Josh Calhoun",
    regionCode: "CA",
  },
].map((p) => ({ ...p, approved: true }));

export const gbPersonTomDillon = personsStub.findIndex((p) => p.name === "Tom Dillon")! + 1;
export const gbPersonSamMarsh = personsStub.findIndex((p) => p.name === "Sam Marsh")! + 1;
export const gbPersonJamesStone = personsStub.findIndex((p) => p.name === "James Stone")! + 1;
export const dePersonHansBauer = personsStub.findIndex((p) => p.name === "Hans Bauer")! + 1;
export const dePersonJakobBach = personsStub.findIndex((p) => p.name === "Jakob Bach")! + 1;
export const dePersonStefanSteinmeier = personsStub.findIndex((p) => p.name === "Stefan Steinmeier")! + 1;
export const jpPersonNaokoYoshida = personsStub.findIndex((p) => p.name === "Naoko Yoshida")! + 1;
export const jpPersonSatoshiNakamura = personsStub.findIndex((p) => p.name === "Satoshi Nakamura")! + 1;
export const krPersonDongJunHyon = personsStub.findIndex((p) => p.name === "Dong-Jun Hyon")! + 1;
export const krPersonSooMinNam = personsStub.findIndex((p) => p.name === "Soo-Min Nam")! + 1;
export const usPersonJohnDoe = personsStub.findIndex((p) => p.name === "John Doe")! + 1;
export const caPersonJoshCalhoun = personsStub.findIndex((p) => p.name === "Josh Calhoun")! + 1;
