import mongoose from 'mongoose';
import { PersonDocument } from '~/src/models/person.model';

export const personsStub = (): PersonDocument[] => {
  return [
    {
      _id: new mongoose.Types.ObjectId('649cbf68675dfd951d5ff268'),
      personId: 1,
      name: 'Willem Klose',
      countryId: 'DE',
    },
    {
      _id: new mongoose.Types.ObjectId('649d277f675dfd951d5ff28e'),
      personId: 2,
      name: 'Rui Reis',
      countryId: 'CH',
    },
    {
      _id: new mongoose.Types.ObjectId('649d27a1675dfd951d5ff29f'),
      personId: 3,
      name: 'Timo Forsthofer',
      countryId: 'DE',
    },
    {
      _id: new mongoose.Types.ObjectId('649d27c1675dfd951d5ff2b0'),
      personId: 4,
      name: 'Deni Mintsaev',
      countryId: 'RU',
    },
    {
      _id: new mongoose.Types.ObjectId('649d27da675dfd951d5ff2c1'),
      personId: 5,
      name: 'Fabian Damke',
      countryId: 'DE',
    },
    {
      _id: new mongoose.Types.ObjectId('649d27f3675dfd951d5ff2d2'),
      personId: 6,
      name: 'Luis Kleinheinz',
      countryId: 'DE',
    },
    {
      _id: new mongoose.Types.ObjectId('649d283c675dfd951d5ff2e4'),
      personId: 7,
      name: 'Grégoire Baur',
      countryId: 'DE',
    },
    {
      _id: new mongoose.Types.ObjectId('649d2951675dfd951d5ff2f5'),
      personId: 8,
      name: 'Kerry Limmer',
      countryId: 'DE',
    },
    // {
    //   _id: new mongoose.Types.ObjectId('649f2ab4a91cfa4672e1880e'),
    //   personId: 9,
    //   name: 'Oliver Fritz',
    //   countryId: 'DE',
    // },
  ] as PersonDocument[];
};
