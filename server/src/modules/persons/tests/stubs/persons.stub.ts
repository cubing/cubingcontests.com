import { mongo } from "mongoose";
import { PersonDocument } from "~/src/models/person.model";

export const personsStub = (): PersonDocument[] => {
  return [
    {
      _id: new mongo.ObjectId("649cbf68675dfd951d5ff268"),
      personId: 1,
      name: "Willem Klose",
      countryIso2: "DE",
    },
    {
      _id: new mongo.ObjectId("649d277f675dfd951d5ff28e"),
      personId: 2,
      name: "Rui Reis",
      countryIso2: "CH",
    },
    {
      _id: new mongo.ObjectId("649d27a1675dfd951d5ff29f"),
      personId: 3,
      name: "Timo Forsthofer",
      countryIso2: "DE",
    },
    {
      _id: new mongo.ObjectId("649d27c1675dfd951d5ff2b0"),
      personId: 4,
      name: "Deni Mintsaev",
      countryIso2: "RU",
    },
    {
      _id: new mongo.ObjectId("649d27da675dfd951d5ff2c1"),
      personId: 5,
      name: "Fabian Damke",
      countryIso2: "DE",
    },
    {
      _id: new mongo.ObjectId("649d27f3675dfd951d5ff2d2"),
      personId: 6,
      name: "Luis Kleinheinz",
      countryIso2: "DE",
    },
    {
      _id: new mongo.ObjectId("649d283c675dfd951d5ff2e4"),
      personId: 7,
      name: "Grégoire Baur",
      countryIso2: "DE",
    },
    {
      _id: new mongo.ObjectId("649d2951675dfd951d5ff2f5"),
      personId: 8,
      name: "Kerry Limmer",
      countryIso2: "DE",
    },
  ] as PersonDocument[];
};
